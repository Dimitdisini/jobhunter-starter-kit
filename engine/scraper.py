#!/usr/bin/env python3
"""
JobHunter Engine: Automated Indeed Vacancy Harvester & Email Cold-Outreach Formatter.
Independent implementation using direct Indeed GraphQL gateway.
"""

import os
import sys
import json
import re
import csv
import time
import argparse
from datetime import datetime

API_URL = "https://apis.indeed.com/graphql"
API_KEY = "161092c2017b5bbab13edb12461a62d5a833871e7cad6d9d475304573de67ac8"

HEADERS = {
    "content-type": "application/json",
    "indeed-api-key": API_KEY,
    "accept": "application/json",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Indeed App 193.1",
    "indeed-app-info": "appv=193.1; appid=com.indeed.jobsearch; osv=16.6.1; os=ios; dtype=phone",
    "indeed-co": "ID",
    "indeed-locale": "id-ID",
}

JUNK_DOMAINS = [
    'example.com', 'test.com', 'indeed.com', 'sentry.io', 'domain.com',
    'email.com', 'w3.org', 'accessibility', 'accommodations', 'noreply',
    'no-reply', 'donotreply', 'privacy', 'recruiting@indeed.com'
]

def load_profile(profile_path="profile.json"):
    if not os.path.exists(profile_path):
        example_path = os.path.join(os.path.dirname(profile_path), "profile.example.json")
        if os.path.exists(example_path):
            with open(example_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "full_name": "Job Seeker",
            "phone": "+62 812-0000-0000",
            "email": "user@gmail.com",
            "portfolio_or_linkedin": "https://linkedin.com",
            "education_background": "Sarjana",
            "university": "Universitas Terkemuka",
            "target_roles": ["Project Coordinator", "Business Development", "Operations Specialist"],
            "target_locations": ["Indonesia"]
        }
    with open(profile_path, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_emails(html_or_text):
    if not html_or_text:
        return []
    clean_text = re.sub(r'<[^>]+>', ' ', html_or_text)
    regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    matches = re.findall(regex, clean_text)
    valid = []
    for m in matches:
        m_lower = m.lower()
        if any(j in m_lower for j in JUNK_DOMAINS):
            continue
        if m_lower.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
            continue
        if m not in valid:
            valid.append(m)
    return valid

def search_indeed(query, location="Indonesia", hours=720, limit=50):
    gql_query = f'''
    query GetJobData {{
        jobSearch(
            what: {json.dumps(query)}
            location: {{where: {json.dumps(location)}, radius: 100, radiusUnit: MILES}}
            limit: {limit}
            sort: RELEVANCE
            filters: [{{ date: {{ field: "dateOnIndeed", start: "{hours}h" }} }}]
        ) {{
            results {{
                job {{
                    key
                    title
                    sourceEmployerName
                    dateOnIndeed
                    description {{ html }}
                    location {{ city admin1Code }}
                    employer {{ name }}
                }}
            }}
        }}
    }}
    '''
    try:
        resp = requests.post(API_URL, json={"query": gql_query}, headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("data", {}).get("jobSearch", {}).get("results", [])
    except Exception as e:
        print(f"[!] Error saat query '{query}': {e}")
    return []

def generate_cover_letter(profile, job_title, company_name):
    full_name = profile.get("full_name", "Pelamar")
    degree = profile.get("education_background", "Lulusan Sarjana")
    univ = profile.get("university", "")
    phone = profile.get("phone", "")
    email = profile.get("email", "")
    portfolio = profile.get("portfolio_or_linkedin", "")

    univ_str = f" dari {univ}" if univ else ""

    body = (
        f"Yth. Tim Rekrutmen & HRD {company_name},\n\n"
        f"Perkenalkan, nama saya {full_name}, berlatar belakang pendidikan {degree}{univ_str}. "
        f"Melalui email ini, saya bermaksud untuk mengajukan lamaran kerja untuk posisi {job_title} di {company_name} "
        f"sesuai dengan informasi lowongan kerja yang dipublikasikan baru-baru ini.\n\n"
        f"Saya memiliki komitmen tinggi terhadap kedisiplinan kerja, kemampuan analisis yang kuat, komunikasi profesional lintas divisi, "
        f"serta orientasi kuat pada hasil kerja yang akurat dan efisien. Berbekal latar belakang akademis dan pengalaman proyek yang telah saya lalui, "
        f"saya yakin dapat segera beradaptasi dan memberikan kontribusi nyata dalam mendukung operasional serta target pertumbuhan tim di {company_name}.\n\n"
        f"Bersama dengan email ini, saya melampirkan berkas Curriculum Vitae (CV) terbaru saya untuk dipelajari lebih lanjut. "
        f"Detail ringkas dan portofolio profesional saya juga dapat diakses melalui: {portfolio}.\n\n"
        f"Besar harapan saya untuk memperoleh kesempatan wawancara agar dapat menjelaskan kualifikasi dan dedikasi saya secara lebih mendalam. "
        f"Terima kasih banyak atas perhatian dan waktu berharga yang Bapak/Ibu berikan.\n\n"
        f"Hormat saya,\n"
        f"{full_name}\n"
        f"Kontak: {phone} | {email}"
    )
    return body

def main():
    parser = argparse.ArgumentParser(description="JobHunter Vacancy Harvester")
    parser.add_argument("--profile", default="profile.json", help="Path to profile JSON config")
    parser.add_argument("--location", default="Indonesia", help="Target location")
    parser.add_argument("--max-jobs", type=int, default=50, help="Target number of vacancies with contact emails")
    parser.add_argument("--output-csv", default="output_loker.csv", help="Output CSV path")
    args = parser.parse_args()

    profile = load_profile(args.profile)
    print(f"[*] Memulai JobHunter Engine untuk: {profile.get('full_name')}")
    print(f"[*] Target Roles: {profile.get('target_roles')}")
    print(f"[*] Target Location: {args.location}")

    roles = profile.get("target_roles", ["Project Coordinator", "Business Development", "Staff"])
    
    harvested = []
    seen_keys = set()
    seen_emails = set()

    for role in roles:
        if len(harvested) >= args.max_jobs:
            break
        print(f"[*] Mencari lowongan aktif untuk: '{role}'...")
        results = search_indeed(role, location=args.location, hours=720, limit=50)
        time.sleep(1)

        for item in results:
            job = item.get("job", {})
            key = job.get("key")
            if not key or key in seen_keys:
                continue

            title = job.get("title", "")
            comp = (job.get("employer", {}) or {}).get("name") or job.get("sourceEmployerName") or "Perusahaan"
            desc_html = (job.get("description", {}) or {}).get("html", "")
            emails = extract_emails(desc_html)

            if emails:
                primary_email = emails[0].strip().lower()
                if primary_email in seen_emails:
                    continue

                seen_keys.add(key)
                seen_emails.add(primary_email)

                url = f"https://id.indeed.com/viewjob?jk={key}"
                subject = f"Lamaran Pekerjaan: {title} – {profile.get('full_name')}"
                body = generate_cover_letter(profile, title, comp)

                harvested.append({
                    "no": len(harvested) + 1,
                    "url": url,
                    "title": title,
                    "company": comp,
                    "email": primary_email,
                    "subject": subject,
                    "category": role,
                    "body": body,
                    "status": "Belum di-blast",
                    "blast_time": "-"
                })

                print(f"  [+] Ditemukan #{len(harvested)}: {title} @ {comp} -> {primary_email}")
                if len(harvested) >= args.max_jobs:
                    break

    # Simpan ke CSV
    print(f"\n[*] Menyimpan {len(harvested)} loker ke file CSV: {args.output_csv}...")
    headers = [
        "No", "Link Postingan", "Posisi", "Perusahaan", "Email Perusahaan",
        "Subjek Email", "Kategori", "Draft Cover Letter", "Keterangan Blast", "Waktu Blast"
    ]
    with open(args.output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for h in harvested:
            writer.writerow([
                h["no"], h["url"], h["title"], h["company"], h["email"],
                h["subject"], h["category"], h["body"], h["status"], h["blast_time"]
            ])

    print(f"[🎉] Selesai! File '{args.output_csv}' siap diimpor ke Google Sheets.")

if __name__ == "__main__":
    main()
