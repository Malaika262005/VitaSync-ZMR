from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import shutil
import os

from analyzer import analyze_text, calculate_trust_score, analyze_patient_symptoms

app = FastAPI(title="VitaSync ZMR Engine Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "data/hospitals.xlsx"
processed_data = []


class PatientMessage(BaseModel):
    message: str


def load_and_process_data(file_path):
    global processed_data

    df = pd.read_excel(file_path)

    possible_name_columns = [
        "name", "hospital_name", "facility_name",
        "Facility Name", "Hospital Name", "facility"
    ]

    possible_notes_columns = [
        "notes", "description", "facility_notes",
        "Notes", "Description", "report", "Report"
    ]

    name_col = None
    notes_col = None

    for col in df.columns:
        if col in possible_name_columns:
            name_col = col
        if col in possible_notes_columns:
            notes_col = col

    if name_col is None:
        name_col = df.columns[0]

    if notes_col is None:
        notes_col = df.columns[-1]

    results = []

    for index, row in df.iterrows():
        hospital_name = str(row.get(name_col, f"Hospital {index + 1}"))
        notes = str(row.get(notes_col, ""))

        analysis = analyze_text(notes)
        trust = calculate_trust_score(analysis["capabilities"])

        results.append({
            "id": index + 1,
            "hospital_name": hospital_name,
            "notes": notes,
            "capabilities": analysis["capabilities"],
            "evidence": analysis["evidence"],
            "trust_score": trust["score"],
            "recommendation": trust["recommendation"],
            "warnings": trust["warnings"]
        })

    processed_data = results
    return results


@app.get("/")
def home():
    return {
        "message": "VitaSync ZMR Engine Backend is running 🚀",
        "status": "success"
    }


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    os.makedirs("data", exist_ok=True)

    file_path = f"data/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    results = load_and_process_data(file_path)

    return {
        "message": "Dataset uploaded and analyzed successfully",
        "total_records": len(results)
    }


@app.get("/analyze")
def analyze_dataset():
    if not os.path.exists(DATA_FILE):
        return {
            "error": "Dataset not found. Upload file using /upload or place hospitals.xlsx inside data folder."
        }

    results = load_and_process_data(DATA_FILE)

    return {
        "total_records": len(results),
        "results": results[:100]
    }


@app.get("/results")
def get_results():
    return {
        "total_records": len(processed_data),
        "results": processed_data[:100]
    }


@app.get("/search")
def search_hospitals(query: str):
    if not processed_data:
        if os.path.exists(DATA_FILE):
            load_and_process_data(DATA_FILE)
        else:
            return {"error": "No dataset loaded."}

    query_lower = query.lower()
    matched_results = []

    for hospital in processed_data:
        notes_text = hospital["notes"].lower()
        capabilities = hospital["capabilities"]

        match_score = 0

        if query_lower in notes_text:
            match_score += 20

        for capability, status in capabilities.items():
            capability_lower = capability.lower()

            if capability_lower in query_lower and status in ["Yes", "Limited"]:
                match_score += 30

            if capability_lower in notes_text and status in ["Yes", "Limited"]:
                match_score += 5

        if match_score > 0:
            hospital_copy = hospital.copy()
            hospital_copy["match_score"] = match_score
            matched_results.append(hospital_copy)

    matched_results = sorted(
        matched_results,
        key=lambda x: (x["match_score"], x["trust_score"]),
        reverse=True
    )

    return {
        "query": query,
        "total_matches": len(matched_results),
        "results": matched_results[:20]
    }


@app.get("/summary")
def summary():
    if not processed_data:
        if os.path.exists(DATA_FILE):
            load_and_process_data(DATA_FILE)
        else:
            return {"error": "No dataset loaded."}

    total = len(processed_data)
    capability_counts = {}

    for hospital in processed_data:
        for capability, status in hospital["capabilities"].items():
            if capability not in capability_counts:
                capability_counts[capability] = {
                    "Yes": 0,
                    "Limited": 0,
                    "No": 0,
                    "Unknown": 0
                }

            capability_counts[capability][status] += 1

    average_trust = sum(h["trust_score"] for h in processed_data) / total if total else 0

    return {
        "total_hospitals": total,
        "average_trust_score": round(average_trust, 2),
        "capability_counts": capability_counts
    }


@app.post("/ai-advisor")
def ai_advisor(data: PatientMessage):
    if not processed_data:
        if os.path.exists(DATA_FILE):
            load_and_process_data(DATA_FILE)
        else:
            return {"error": "No dataset loaded."}

    analysis = analyze_patient_symptoms(data.message)

    recommended_hospitals = []

    if analysis["doctor_needed"] and analysis["search_query"]:
        query_lower = analysis["search_query"].lower()

        for hospital in processed_data:
            notes_text = hospital["notes"].lower()
            capabilities = hospital["capabilities"]

            match_score = 0

            for capability, status in capabilities.items():
                capability_lower = capability.lower()

                if capability_lower in query_lower and status == "Yes":
                    match_score += 30

                if capability_lower in notes_text and status == "Yes":
                    match_score += 5

            if match_score > 0:
                hospital_copy = hospital.copy()
                hospital_copy["match_score"] = match_score
                recommended_hospitals.append(hospital_copy)

        recommended_hospitals = sorted(
            recommended_hospitals,
            key=lambda x: (x["match_score"], x["trust_score"]),
            reverse=True
        )[:3]

    return {
        "patient_message": data.message,
        "severity": analysis["severity"],
        "doctor_needed": analysis["doctor_needed"],
        "advice": analysis["advice"],
        "disclaimer": analysis["disclaimer"],
        "recommended_hospitals": recommended_hospitals
    }