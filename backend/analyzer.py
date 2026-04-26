import re


def analyze_text(text):
    text = str(text).lower()

    result = {
        "ICU": "Yes" if "icu" in text else "No",
        "Oxygen": "Yes" if "oxygen" in text else "No",
        "Doctor": "Yes" if "doctor" in text or "doctors" in text or "specialist" in text else "No",
        "Surgery": "Yes" if "surgery" in text or "operation" in text or "operations" in text else "No",

        "Emergency": "Yes" if "emergency" in text or "urgent" in text else "No",
        "Ventilator": "Yes" if "ventilator" in text else "No",
        "Ambulance": "Yes" if "ambulance" in text else "No",
        "24/7 Service": "Yes" if "24/7" in text or "24*7" in text or "24 hours" in text or "24 hrs" in text or "round-the-clock" in text else "No",
        "Neonatal Beds": "Yes" if "neonatal" in text or "nicu" in text or "newborn" in text else "No",
        "Dialysis": "Yes" if "dialysis" in text or "kidney" in text else "No",
        "Oncology": "Yes" if "oncology" in text or "cancer" in text else "No",
        "Blood Bank": "Yes" if "blood bank" in text or "blood available" in text else "No"
    }

    return {
        "capabilities": result,
        "evidence": {}
    }


def calculate_trust_score(capabilities):
    score = 0
    warnings = []

    critical_services = [
        "ICU", "Oxygen", "Doctor", "Surgery",
        "Ventilator", "Blood Bank"
    ]

    emergency_services = [
        "Emergency", "Ambulance", "24/7 Service"
    ]

    critical_yes = sum(
        1 for service in critical_services
        if capabilities.get(service) == "Yes"
    )

    emergency_yes = sum(
        1 for service in emergency_services
        if capabilities.get(service) == "Yes"
    )

    # 1) Critical services available = 40 marks
    score += (critical_yes / len(critical_services)) * 40

    # 2) Emergency readiness = 25 marks
    score += (emergency_yes / len(emergency_services)) * 25

    # 3) Data completeness = 20 marks
    total_fields = len(capabilities)
    known_fields = sum(
        1 for value in capabilities.values()
        if value in ["Yes", "No"]
    )
    score += (known_fields / total_fields) * 20

    # 4) Risk / missing info = 15 marks
    risk_score = 15

    if capabilities.get("Surgery") == "Yes" and capabilities.get("Doctor") != "Yes":
        risk_score -= 8
        warnings.append("Surgery available but doctor information is missing.")

    if capabilities.get("Emergency") == "Yes" and capabilities.get("Ambulance") != "Yes":
        risk_score -= 4
        warnings.append("Emergency available but ambulance information is missing.")

    if capabilities.get("ICU") == "Yes" and capabilities.get("Oxygen") != "Yes":
        risk_score -= 3
        warnings.append("ICU available but oxygen information is missing.")

    if capabilities.get("Ventilator") == "Yes" and capabilities.get("ICU") != "Yes":
        risk_score -= 5
        warnings.append("Ventilator mentioned but ICU information is missing.")

    score += max(0, risk_score)
    score = round(max(0, min(score, 100)))

    if score >= 75:
        recommendation = "Reliable"
    elif score >= 50:
        recommendation = "Verify"
    else:
        recommendation = "Risky"

    return {
        "score": score,
        "recommendation": recommendation,
        "warnings": warnings
    }


def analyze_patient_symptoms(message):
    text = str(message).lower()

    mild_keywords = [
        "minor", "mild", "slight", "light pain", "little"
    ]

    emergency_keywords = [
        "chest pain", "breathing", "difficulty breathing", "shortness of breath",
        "unconscious", "severe bleeding", "accident", "stroke",
        "heart attack", "seizure", "can't breathe", "injury",
        "severe injury", "fracture", "broken", "trauma",
        "head injury", "bleeding", "critical", "emergency"
    ]

    moderate_keywords = [
        "fever", "vomiting", "infection", "pain", "cough",
        "weakness", "dizziness", "headache", "diarrhea",
        "stomach pain", "body pain", "throat pain"
    ]

    if any(word in text for word in mild_keywords):
        severity = "mild"
        doctor_needed = False
        advice = "This seems mild. Take rest, stay hydrated, and monitor your symptoms."
        search_query = ""

    elif any(word in text for word in emergency_keywords) or "severe" in text:
        severity = "emergency"
        doctor_needed = True
        advice = "This may be serious. Please seek urgent medical help immediately."
        search_query = "emergency doctor oxygen icu ambulance ventilator"

    elif any(word in text for word in moderate_keywords):
        severity = "moderate"
        doctor_needed = True
        advice = "Doctor consultation is recommended, especially if symptoms continue or get worse."
        search_query = "doctor emergency 24/7 service"

    else:
        severity = "mild"
        doctor_needed = False
        advice = "This seems mild. Take rest, drink water, monitor symptoms, and consult a doctor if it worsens."
        search_query = ""

    return {
        "severity": severity,
        "doctor_needed": doctor_needed,
        "advice": advice,
        "search_query": search_query,
        "disclaimer": "This is general guidance only, not a medical diagnosis."
    }