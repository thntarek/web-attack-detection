import os
import re

import pandas as pd

INPUT_FILE = "payload_full.csv"


def clean_payload(x):
    if pd.isna(x):
        return ""
    x = str(x)

    # lowercase
    x = x.lower()

    # remove all whitespace
    x = re.sub(r"\s+", "", x)

    return x


df = pd.read_csv(INPUT_FILE)

# keep tracking column
df = df[["payload", "attack_type", "label"]]

# clean payload
df["payload"] = df["payload"].apply(clean_payload)

# clean attack type
df["attack_type"] = df["attack_type"].astype(str).str.lower().str.strip()

# remove empty
df = df[(df.payload != "") & (df.attack_type != "")]

# remove duplicate samples
df = df.drop_duplicates(subset=["payload", "attack_type", "label"])

# convert label
df["label"] = df["label"].map({"norm": 0, "anom": 1})

# remove invalid labels
df = df.dropna()


# 5% evaluation from EACH attack
evaluate = []

for attack_type, group in df.groupby("attack_type"):
    n = max(1, int(len(group) * 0.1))
    sample = group.sample(n=n, random_state=42)
    evaluate.append(sample)

evaluate_df = pd.concat(evaluate)

# remove evaluation samples
remaining = df.drop(evaluate_df.index)


# training 95%
train_df = remaining[["payload", "attack_type", "label"]]
evaluate_df = evaluate_df[["payload", "attack_type", "label"]]
train_df.to_csv("clean_training.csv", index=False)
evaluate_df.to_csv("clean_evaluate.csv", index=False)

print("===================")
print("Training samples:", len(train_df))
print("Evaluation samples:", len(evaluate_df))
print("\nTraining attack distribution")
print(train_df.attack_type.value_counts())
print("\nEvaluation attack distribution")
print(evaluate_df.attack_type.value_counts())
print("\nSaved:")
print("clean_training.csv")
print("clean_evaluate.csv")
