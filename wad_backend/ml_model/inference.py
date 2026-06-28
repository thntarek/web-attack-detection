import re

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODEL_PATH = "ml_model/saved_model/model"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print("ML Device:", DEVICE)


tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.to(DEVICE)
model.eval()


def clean_payload(payload):
    payload = str(payload)
    payload = payload.lower()
    payload = re.sub(r"\s+", "", payload)

    return payload


def predict(payload):
    payload = clean_payload(payload)
    if payload == "":
        return 0

    inputs = tokenizer(
        payload,
        truncation=True,
        max_length=256,
        padding="max_length",
        return_tensors="pt",
    )
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
    with torch.inference_mode():
        output = model(**inputs)
        prediction = torch.argmax(output.logits, dim=1)

    return int(prediction.item())


if __name__ == "__main__":
    while True:
        payload = input("Enter payload: ")
        print(f"Prediction: {predict(payload)}")
