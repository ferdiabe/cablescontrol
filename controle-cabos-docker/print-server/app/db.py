from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = 'sqlite:///./templates.db'

engine = create_engine(
    DATABASE_URL, connect_args={'check_same_thread': False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Template(Base):
    __tablename__ = 'templates'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    language = Column(String, nullable=False)
    content = Column(Text, nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)

