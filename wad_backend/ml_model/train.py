import os

import pandas as pd
import torch
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

MODEL_NAME = "microsoft/MiniLM-L12-H384-uncased"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print("Device:", DEVICE)


# =========================
# Dataset
# =========================
class AttackDataset(Dataset):
    def __init__(self, df, tokenizer):
        self.texts = df.payload.tolist()
        self.labels = df.label.tolist()
        self.tokenizer = tokenizer

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        item = self.tokenizer(
            self.texts[idx], max_length=256, truncation=True, padding="max_length"
        )
        item = {k: torch.tensor(v) for k, v in item.items()}
        item["labels"] = torch.tensor(self.labels[idx])

        return item


# =========================
# Load data
# =========================
df = pd.read_csv("clean_training.csv")


# remove attack_type from model
df = df[["payload", "label"]]
print(df.label.value_counts())


# =========================
# train/test split
# =========================
train_df, val_df = train_test_split(
    df, test_size=0.15, random_state=42, stratify=df["label"]
)

print("Train:", len(train_df))
print("Validation:", len(val_df))

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
train_dataset = AttackDataset(train_df, tokenizer)
val_dataset = AttackDataset(val_df, tokenizer)


# =========================
# Model
# =========================
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)
model.to(DEVICE)


# =========================
# Metrics
# =========================
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = logits.argmax(axis=1)
    probs = torch.softmax(torch.tensor(logits), dim=1)[:, 1].numpy()

    return {
        "accuracy": accuracy_score(labels, predictions),
        "precision": precision_score(labels, predictions, zero_division=0),
        "recall": recall_score(labels, predictions, zero_division=0),
        "f1": f1_score(labels, predictions, zero_division=0),
        "auc": roc_auc_score(labels, probs),
    }


# =========================
# Training
# =========================
training_args = TrainingArguments(
    output_dir="saved_model",
    num_train_epochs=5,
    per_device_train_batch_size=32,
    per_device_eval_batch_size=32,
    learning_rate=2e-5,
    weight_decay=0.01,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    greater_is_better=True,
    fp16=torch.cuda.is_available(),
    report_to="none",
)
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics,
)
trainer.train()


# =========================
# Final validation report
# =========================
print("\nFINAL VALIDATION RESULT")

result = trainer.predict(val_dataset)
logits = result.predictions

y_true = result.label_ids
y_pred = logits.argmax(axis=1)

print("\nConfusion Matrix")
print(confusion_matrix(y_true, y_pred))
print("\nClassification Report")
print(classification_report(y_true, y_pred, target_names=["normal", "attack"]))


# =========================
# Save best model
# =========================
os.makedirs("saved_model/model", exist_ok=True)
trainer.save_model("saved_model/model")
tokenizer.save_pretrained("saved_model/model")
print("\nBest model saved:")
print("saved_model/model")
