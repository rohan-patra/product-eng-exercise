import os
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv
from flask import request, Flask
import random
from collections import defaultdict

load_dotenv()

app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# credit Claude
def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot_product = sum(x * y for x, y in zip(v1, v2))
    norm1 = sum(x * x for x in v1) ** 0.5
    norm2 = sum(x * x for x in v2) ** 0.5
    return dot_product / (norm1 * norm2) if norm1 * norm2 != 0 else 0


# credit Claude
def kmeans_clustering(
    vectors: List[List[float]], k: int, max_iters: int = 100
) -> List[int]:
    n_features = len(vectors[0])
    centroids = random.sample(vectors, k)

    for _ in range(max_iters):
        clusters = defaultdict(list)
        assignments = []

        for i, vector in enumerate(vectors):
            best_centroid = max(
                range(k), key=lambda c: cosine_similarity(vector, centroids[c])
            )
            clusters[best_centroid].append(i)
            assignments.append(best_centroid)

        # Update centroids
        new_centroids = []
        for i in range(k):
            if not clusters[i]:
                new_centroids.append(centroids[i])
                continue

            # Calculate mean of vectors in cluster
            cluster_vectors = [vectors[idx] for idx in clusters[i]]
            mean_vector = [
                sum(v[j] for v in cluster_vectors) / len(cluster_vectors)
                for j in range(n_features)
            ]
            new_centroids.append(mean_vector)

        if new_centroids == centroids:
            break

        centroids = new_centroids

    return assignments


def get_embeddings(texts: List[str]) -> List[List[float]]:
    response = client.embeddings.create(model="text-embedding-3-large", input=texts)
    return [embedding.embedding for embedding in response.data]


def get_cluster_name(items: List[Dict[str, Any]]) -> str:
    items_str = "\n".join(
        [f"- {item['name']}: {item['description']}" for item in items[:5]]
    )

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "Generate a short, descriptive name for a group of similar feedback items. It should be 3-6 words and be intuitive as to what the feedback is requesting or suggesting.",
            },
            {
                "role": "user",
                "content": f"Feedback items:\n{items_str}",
            },
        ],
    )
    return completion.choices[0].message.content.strip()


def group_feedback(feedback_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not feedback_items:
        return []

    texts = [f"{item['name']} {item['description']}" for item in feedback_items]

    try:
        embeddings = get_embeddings(texts)
    except Exception as e:
        print(f"Error getting embeddings: {e}")
        return [{"name": "All Feedback", "feedback": feedback_items}]

    # credit Claude
    n_clusters = min(max(2, len(feedback_items) // 5), 6)

    clusters = kmeans_clustering(embeddings, n_clusters)

    grouped_items = defaultdict(list)
    for item, cluster_id in zip(feedback_items, clusters):
        grouped_items[cluster_id].append(item)

    groups = []
    for cluster_items in grouped_items.values():
        sorted_items = sorted(
            cluster_items,
            key=lambda x: {"High": 0, "Medium": 1, "Low": 2}[x["importance"]],
        )

        group_name = get_cluster_name(sorted_items)
        groups.append({"name": group_name, "feedback": sorted_items})

    groups.sort(
        key=lambda g: max(
            {"High": 0, "Medium": 1, "Low": 2}[item["importance"]]
            for item in g["feedback"]
        )
    )

    return groups


@app.route("/", methods=["POST"])
def endpoint():
    feedback_items = request.get_json()["feedback"]
    grouped_feedback = group_feedback(feedback_items)
    return {"feedback": feedback_items, "groups": grouped_feedback}
