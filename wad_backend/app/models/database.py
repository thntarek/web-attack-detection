from sqlalchemy import Column, Float, Integer, String, Text

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(50), unique=True, nullable=False, index=True)
    username = Column(String(20), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    hash_password = Column(String(255), nullable=False)
    secret_note = Column(Text, nullable=True)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    payload = Column(Text, nullable=False)
    original_label = Column(Integer, nullable=False)
    ml_pred = Column(Integer, nullable=True, default=None)
    waf_pred = Column(Integer, nullable=True, default=None)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_type = Column(String(20), nullable=False)
    title = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    price = Column(Float, nullable=False)


class InstantTest(Base):
    __tablename__ = "instant_test"

    id = Column(Integer, primary_key=True, index=True)
    payload = Column(Text, nullable=False)
    original_label = Column(Integer, nullable=False)
    llm_pred = Column(Integer, nullable=True)
    ml_pred = Column(Integer, nullable=True)
    waf_pred = Column(Integer, nullable=True)


class TestingOutput(Base):
    __tablename__ = "testing_output"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    accuracy = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    tn = Column(Integer, nullable=True)
    tp = Column(Integer, nullable=True)
    fn = Column(Integer, nullable=True)
    fp = Column(Integer, nullable=True)
