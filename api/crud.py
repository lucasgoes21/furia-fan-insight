
from model import Fan , ExternalData
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import json


async def save_fan(db: AsyncSession, fan_data: dict):
    db_fan = Fan(**fan_data)
    db.add(db_fan)
    await db.commit()
    await db.refresh(db_fan)
    return db_fan

async def get_all_fans():
    async with async_session() as session:
        result = await session.execute(select(Fan))
        fans = result.scalars().all()

        # Converte o campo 'jogos_favoritos' de volta para lista
        fans_formatados = []
        for fan in fans:
            fan_data = fan.__dict__.copy()
            fan_data.pop("_sa_instance_state", None)
            fan_data["jogos_favoritos"] = fan_data["jogos_favoritos"].split(",") if fan_data["jogos_favoritos"] else []
            fans_formatados.append(fan_data)

        return fans_formatados

async def get_fan_by_cpf(db: AsyncSession, cpf: str):
    result = await db.execute(select(Fan).where(Fan.cpf == cpf))
    return result.scalar_one_or_none()

async def get_data_by_id(db: AsyncSession, fan_id: str):
    result = await db.execute(select(ExternalData).where(ExternalData.fan_id == fan_id))
    return result.scalar_one_or_none()


async def salvar_dados_twitter(db: AsyncSession, fan: int, twitter_data: str):
    # Busca registro existente

    
    stmt = select(ExternalData).where(ExternalData.fan_id == fan.id)
    result = await db.execute(stmt)
    external_data = result.scalars().first()

    twitter_data = json.dumps(twitter_data)

    if external_data:
        external_data.twitter_data = twitter_data
    else:
        external_data = ExternalData(
            fan_id=fan.id,
            twitter_data=twitter_data
        )
        db.add(external_data)

    await db.commit()

async def salvar_dados_twitch(db: AsyncSession, fan: int, twitch_data: str):
    # Busca registro existente

    
    stmt = select(ExternalData).where(ExternalData.fan_id == fan.id)
    result = await db.execute(stmt)
    external_data = result.scalars().first()

    twitch_data = json.dumps(twitch_data)

    if external_data:
        external_data.twitch_data = twitch_data
    else:
        external_data = ExternalData(
            fan_id=fan.id,
            twitch_data=twitch_data
        )
        db.add(external_data)

    await db.commit()