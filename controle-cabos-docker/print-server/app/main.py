from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import Template, SessionLocal, init_db
from .printer import get_driver

app = FastAPI(title="Label Print Server")
init_db()


class TemplateCreate(BaseModel):
    name: str
    language: str
    content: str


class TemplateOut(BaseModel):
    id: int
    name: str
    language: str
    content: str

    class Config:
        orm_mode = True


class PrintRequest(BaseModel):
    template_id: int
    data: dict
    copies: int = 1


@app.post("/templates", response_model=TemplateOut)
def create_template(tpl: TemplateCreate):
    db: Session = SessionLocal()
    template = Template(name=tpl.name, language=tpl.language, content=tpl.content)
    db.add(template)
    db.commit()
    db.refresh(template)
    db.close()
    return template


@app.get("/templates", response_model=list[TemplateOut])
def list_templates():
    db: Session = SessionLocal()
    templates = db.query(Template).all()
    db.close()
    return templates


@app.get("/templates/{template_id}", response_model=TemplateOut)
def get_template(template_id: int):
    db: Session = SessionLocal()
    template = db.query(Template).filter(Template.id == template_id).first()
    db.close()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@app.post("/print")
def print_label(req: PrintRequest):
    db: Session = SessionLocal()
    template = db.query(Template).filter(Template.id == req.template_id).first()
    db.close()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    driver = get_driver(template.language)
    command = driver.render(template.content, req.data)
    for _ in range(req.copies):
        driver.send(command)
    return {"status": "sent", "copies": req.copies}


@app.get("/health")
def health():
    return {"status": "ok"}

