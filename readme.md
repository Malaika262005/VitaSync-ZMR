# 🏥 VitaSync ZMR – AI-Powered Healthcare Decision Support System

## 🚀 Overview

VitaSync is an intelligent healthcare assistant designed to help users make informed medical decisions.
Instead of just listing hospitals, the system analyzes patient symptoms, evaluates hospital capabilities, and provides trust-based recommendations.

---

## 🎯 Problem Statement

Many patients struggle to:

* Find reliable hospitals quickly
* Understand which hospital suits their condition
* Evaluate hospital capabilities and trustworthiness

VitaSync solves this by combining **AI guidance + hospital analysis + trust scoring**.

---

## 💡 Solution

VitaSync provides:

* 🤖 AI-based symptom analysis
* 🏥 Smart hospital search
* 🛡 Trust score evaluation
* 📊 Reports and analytics

---

## 🧠 Key Features

### 🔍 1. Smart Hospital Search

* Search hospitals based on medical needs
* Displays:

  * Capabilities (ICU, Oxygen, Emergency, Ventilator, etc.)
  * Trust Score
  * Recommendations
* Interactive map integration
* Click hospital → map focus

---

### 🤖 2. AI Medical Assistant

* Users describe symptoms in natural language
* AI classifies:

  * 🟢 Mild → home care suggestions
  * 🟡 Moderate → doctor recommended
  * 🔴 Emergency → urgent hospital recommendation
* Provides:

  * Severity level
  * Advice
  * Recommended hospitals

---

### 🛡 3. Trust Score System

Hospitals are evaluated using a **4-factor scoring model**:

| Factor              | Weight |
| ------------------- | ------ |
| Critical Services   | 40%    |
| Emergency Readiness | 25%    |
| Data Completeness   | 20%    |
| Risk Factors        | 15%    |

Outputs:

* Score (0–100)
* Recommendation (Reliable / Verify / Risky)
* Smart warnings for missing critical data

---

### 📊 4. Reports & Analytics

* Total hospitals
* ICU / Oxygen availability %
* Doctor & Surgery availability
* High-trust hospital percentage
* Average trust score

---

## 📌 Dataset & Data Note

The hospital data used in this prototype is based on the dataset provided in the challenge resources.

Some additional fields and capabilities (such as Ventilator, Ambulance, Blood Bank, etc.) were added manually as **demo data**, since they were not available in the provided dataset.

These additions are used only to demonstrate how the system can scale and function with a more complete real-world healthcare database or live APIs.

---

## ⚙️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript
* Leaflet.js (Map integration)

### Backend

* Python
* FastAPI
* Pandas

---

## 🔗 API Endpoints

| Endpoint      | Method | Description         |
| ------------- | ------ | ------------------- |
| `/search`     | GET    | Search hospitals    |
| `/summary`    | GET    | Get analytics data  |
| `/ai-advisor` | POST   | AI symptom analysis |

---

## 🧪 How It Works

1. User enters symptoms or search query
2. Backend analyzes hospital dataset
3. AI determines severity of condition
4. System ranks hospitals using trust score
5. Results displayed with recommendations and map

---

## ⚠️ Disclaimer

This system provides **general guidance only** and is not a substitute for professional medical advice.

---

## 🌟 Future Improvements

* Real-time hospital data integration
* Government healthcare APIs
* Live ICU/bed availability
* Voice-based AI assistant
* Mobile app version

---

## 👥 Team

**Team Leader:**
Malaika Shahzadi

**Team Members:**

* Raiha
* Zainab

---

## 💬 Final Note

VitaSync is not just a project — it is a step towards smarter and safer healthcare decisions using AI.
