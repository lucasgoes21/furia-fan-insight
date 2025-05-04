from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base , relationship
from datetime import datetime

Base = declarative_base()

class Fan(Base):
    __tablename__ = "fans"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False)
    data_nascimento = Column(String, nullable=False)
    jogos_favoritos = Column(String, nullable=False)
    teams_favoritos = Column(String, nullable=False)
    eventos_participados = Column(String, nullable=True)
    link_perfil = Column(String, nullable=True)
    file = Column(String, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    external_data = relationship("ExternalData", back_populates="fan", uselist=False)

class ExternalData(Base):
    __tablename__ = "external_data"

    id = Column(Integer, primary_key=True, index=True)
    fan_id = Column(Integer, ForeignKey("fans.id"), nullable=False)

    twitch_data = Column(String, nullable=True)  # Armazena JSON como string
    twitter_data = Column(String, nullable=True)  # Armazena JSON como string
    criado_em = Column(DateTime, default=datetime.utcnow)

    fan = relationship("Fan", back_populates="external_data")