import os
import shutil
from datetime import datetime, date
from typing import List
from fastapi import FastAPI, Depends, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

import models, schemas
from database import SessionLocal, engine, get_db

# Skapa tabeller
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

# --- AUTO-SEEDING AV PLATSHÅLLARE ---
@app.on_event("startup")
def seed_placeholders():
    # Vi behöver skapa en ny session manuellt här eftersom vi inte är i en request
    db = SessionLocal()
    try:
        defaults = [
            {"name": "🥡 Takeaway", "tags": "Snabbval"},
            {"name": "🍽️ Äter ute", "tags": "Snabbval"},
            {"name": "🥪 Fixar eget", "tags": "Snabbval"},
            {"name": "🍕 Rester", "tags": "Snabbval"}
        ]

        for item in defaults:
            exists = db.query(models.RecipeDB).filter(
                models.RecipeDB.name == item["name"],
                models.RecipeDB.is_placeholder == True
            ).first()

            if not exists:
                new_placeholder = models.RecipeDB(
                    name=item["name"],
                    tags=item["tags"],
                    default_portions=1,
                    is_placeholder=True, # Viktigt!
                    is_test_recipe=False
                )
                db.add(new_placeholder)

        recept = [
            {"name": "Spaghetti Bolognese", "tags": "Italienskt, Pasta"},
            {"name": "Kyckling Curry", "tags": "Asiatiskt, Kryddigt"},
            {"name": "Vegetarisk Lasagne", "tags": "Italienskt, Vegetariskt"},
            {"name": "Tacos", "tags": "Mexikanskt, Snabbt"},
            {"name": "Lax med Citron och Dill", "tags": "Fisk, Hälsosamt"},
            {"name": "Grillad Ostsmörgås", "tags": "Snabbt, Vegetariskt"},
            {"name": "Caesarsallad", "tags": "Sallad, Lätt"},
            {"name": "Chili con Carne", "tags": "Kryddigt, Gryta"},
            {"name": "Pannkakor", "tags": "Sött, Frukost"},
            {"name": "Sushi Bowl", "tags": "Japanskt, Hälsosamt"}
        ]

        for item in recept:
            exists = db.query(models.RecipeDB).filter(
                models.RecipeDB.name == item["name"],
                models.RecipeDB.is_test_recipe == True
            ).first()
            if not exists:
                new_test_recipe = models.RecipeDB(
                    name=item["name"],
                    tags=item["tags"],
                    default_portions=4,
                    is_placeholder=False,
                    is_test_recipe=True
                )
                db.add(new_test_recipe)
        db.commit()
        print("✅ Platshållare kontrollerade/skapade.")

        # 2. Seed Settings (NYTT)
        if not db.query(models.SettingDB).filter(models.SettingDB.key == "name_A").first():
            db.add(models.SettingDB(key="name_A", value="Person A"))
        if not db.query(models.SettingDB).filter(models.SettingDB.key == "name_B").first():
            db.add(models.SettingDB(key="name_B", value="Person B"))
        db.commit()
        print("✅ Inställningar kontrollerade/skapade.")

    finally:
        db.close()

@app.get("/recipes", response_model=List[schemas.Recipe])
def get_recipes(sort_by: str = "vote", sort_order: str = "desc", db: Session = Depends(get_db)):
    query = db.query(models.RecipeDB).filter(models.RecipeDB.is_deleted == False)

    # Bestäm sorteringskolumn
    if sort_by == "name":
        # HÄR ÄR ÄNDRINGEN: Använd func.lower() för att ignorera stor/liten bokstav
        column = func.lower(models.RecipeDB.name)
    elif sort_by == "last_cooked":
        column = models.RecipeDB.last_cooked_date
    else:
        column = models.RecipeDB.vote_count

    # Bestäm ordning (ASC eller DESC)
    if sort_order == "asc":
        if sort_by == "last_cooked":
            query = query.order_by(column.asc().nullsfirst())
        else:
            query = query.order_by(column.asc())
    else:
        if sort_by == "last_cooked":
            query = query.order_by(column.desc().nullslast())
        else:
            query = query.order_by(column.desc())

    # HÄR ÄR ÄNDRING 2: Även "Tie-breakern" (sekundär sortering) ska vara snygg
    # Om två recept har samma röster, sortera dem A-Ö oberoende av gemener/versaler
    query = query.order_by(func.lower(models.RecipeDB.name).asc())

    return query.all()

@app.post("/recipes", response_model=schemas.Recipe)
async def create_recipe(
    name: str = Form(...),
    link: str = Form(None),
    portions: int = Form(4),
    tags: str = Form(""),
    notes: str = Form(None),    # <--- NY PARAMETER
    image_url: str = Form(None),  # <--- NY PARAMETER
    is_test: bool = Form(False),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    filename = None
    if file:
        timestamp = int(datetime.now().timestamp())
        filename = f"{timestamp}_{file.filename}"
        file_location = f"{UPLOAD_DIR}/{filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

    db_recipe = models.RecipeDB(
        name=name,
        link=link,
        default_portions=portions,
        tags=tags,
        notes=notes,          # <--- SPARA I DATABASEN
        image_url=image_url,      # <--- SPARA
        is_test_recipe=is_test,
        image_filename=filename
    )

    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.put("/recipes/{recipe_id}", response_model=schemas.Recipe)
async def update_recipe(
    recipe_id: int,
    name: str = Form(...),
    link: str = Form(None),
    portions: int = Form(4),
    tags: str = Form(""),
    notes: str = Form(None),
    image_url: str = Form(None),  # <--- NY PARAMETER
    is_test: bool = Form(False),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # 1. Hämta receptet
    db_recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # 2. Hantera bild (om en ny laddas upp)
    if file:
        # (Valfritt: Här skulle man kunna radera den gamla bilden från disken för att spara plats)
        timestamp = int(datetime.now().timestamp())
        filename = f"{timestamp}_{file.filename}"
        file_location = f"{UPLOAD_DIR}/{filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        db_recipe.image_filename = filename # Uppdatera referensen

    # 3. Uppdatera övriga fält
    db_recipe.name = name
    db_recipe.link = link
    db_recipe.image_url = image_url
    db_recipe.default_portions = portions
    db_recipe.tags = tags
    db_recipe.notes = notes
    db_recipe.is_test_recipe = is_test

    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.put("/recipes/{recipe_id}/vote")
def vote_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    if recipe:
        recipe.vote_count += 1
        db.commit()
    return {"ok": True}

@app.get("/plan")
def get_plan(start_date: date, end_date: date, db: Session = Depends(get_db)):
    return db.query(models.PlanSlotDB).filter(
        models.PlanSlotDB.plan_date >= start_date,
        models.PlanSlotDB.plan_date <= end_date
    ).all()

@app.post("/plan")
def update_plan_slot(slot: schemas.PlanSlotUpdate, db: Session = Depends(get_db)):
    # 1. Hitta eller skapa slotten
    db_slot = db.query(models.PlanSlotDB).filter(
        models.PlanSlotDB.plan_date == slot.plan_date,
        models.PlanSlotDB.meal_type == slot.meal_type,
        models.PlanSlotDB.person == slot.person
    ).first()

    if not db_slot:
        db_slot = models.PlanSlotDB(
            plan_date=slot.plan_date,
            meal_type=slot.meal_type,
            person=slot.person
        )
        db.add(db_slot)

    # Spara gamla recipe_id för att kunna uppdatera det gamla receptet om vi byter
    old_recipe_id = db_slot.recipe_id
    new_recipe_id = slot.recipe_id

    # 2. Uppdatera slotten
    db_slot.recipe_id = new_recipe_id
    db.commit() # Commit direkt för att sökningen nedan ska hitta nya datumet

    # 3. Hjälpfunktion för att räkna om "last_cooked"
    def update_recipe_last_cooked(r_id):
        if not r_id: return
        # Sök efter det sista datumet denna rätt förekommer i plan_slots
        max_date = db.query(func.max(models.PlanSlotDB.plan_date)).filter(
            models.PlanSlotDB.recipe_id == r_id
        ).scalar()

        recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == r_id).first()
        if recipe:
            recipe.last_cooked_date = max_date
            # Valfritt: Nollställ röster om den planeras i framtiden
            if max_date and max_date >= date.today():
                 recipe.vote_count = 0
            db.add(recipe)

    # Uppdatera både nya receptet (om det finns) och det gamla (om vi tog bort det)
    if new_recipe_id:
        update_recipe_last_cooked(new_recipe_id)

    if old_recipe_id and old_recipe_id != new_recipe_id:
        update_recipe_last_cooked(old_recipe_id)

    db.commit()
    return db_slot

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.is_deleted = True
    db.commit()
    return {"ok": True}

# --- SETTINGS ENDPOINTS ---

@app.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    # Hämta namnen, eller returnera defaults om de inte finns
    s_a = db.query(models.SettingDB).filter(models.SettingDB.key == "name_A").first()
    s_b = db.query(models.SettingDB).filter(models.SettingDB.key == "name_B").first()

    return {
        "name_A": s_a.value if s_a else "Person A",
        "name_B": s_b.value if s_b else "Person B"
    }

@app.post("/settings")
def update_settings(settings: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    # Uppdatera A
    s_a = db.query(models.SettingDB).filter(models.SettingDB.key == "name_A").first()
    if not s_a:
        s_a = models.SettingDB(key="name_A")
        db.add(s_a)
    s_a.value = settings.name_A

    # Uppdatera B
    s_b = db.query(models.SettingDB).filter(models.SettingDB.key == "name_B").first()
    if not s_b:
        s_b = models.SettingDB(key="name_B")
        db.add(s_b)
    s_b.value = settings.name_B

    db.commit()
    return {"ok": True}