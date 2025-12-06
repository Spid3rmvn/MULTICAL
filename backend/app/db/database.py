"""
SQLite Database Connection and Session Management
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

from app.core.config import settings

# Ensure database directory exists
db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "database")
os.makedirs(db_dir, exist_ok=True)

# Database URL - using relative path from backend directory
DATABASE_URL = f"sqlite+aiosqlite:///{os.path.join(db_dir, 'multical.db')}"

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


async def init_db():
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connection"""
    await engine.dispose()
