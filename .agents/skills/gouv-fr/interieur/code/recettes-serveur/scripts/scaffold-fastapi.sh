#!/usr/bin/env bash
set -euo pipefail

# CoFabNum FastAPI Scaffold
# Creates a new FastAPI project with CoFabNum conventions using uv.
# Usage: bash scripts/scaffold-fastapi.sh <project-name>

NAME="${1:-}"

if [[ -z "$NAME" ]]; then
  echo "Error: project name is required"
  echo "Usage: bash scripts/scaffold-fastapi.sh <project-name>"
  echo "Example: bash scripts/scaffold-fastapi.sh my-api"
  exit 1
fi

echo "Creating FastAPI project: $NAME"

# Initialize with uv
uv init "$NAME"
cd "$NAME"

# Add core dependencies
uv add "fastapi[standard]"

# Add dev dependencies
uv add --dev ruff pytest httpx

# Create application structure
mkdir -p app/{models,schemas,routers,services,utils}

# Create __init__.py files
touch app/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/routers/__init__.py
touch app/services/__init__.py
touch app/utils/__init__.py
touch tests/__init__.py

# Main application
cat > app/main.py << 'EOF'
from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application démarrée")
    yield
    logger.info("Application arrêtée")


app = FastAPI(title="My API", version="1.0.0", lifespan=lifespan)

# Routers
from app.routers import cats
app.include_router(cats.router)
EOF

# Config
cat > app/config.py << 'EOF'
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://user:pass@localhost:5432/mydb"
    secret_key: str = "change-me-in-production"
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
EOF

# Example Pydantic schemas
cat > app/schemas/cat.py << 'EOF'
from pydantic import BaseModel, Field


class CatBase(BaseModel):
    name: str = Field(min_length=1, description="Nom du chat")
    age: int = Field(ge=0, description="Âge du chat")


class CatCreate(CatBase):
    pass


class CatResponse(CatBase):
    id: int

    model_config = {"from_attributes": True}
EOF

# Example router
cat > app/routers/cats.py << 'EOF'
from fastapi import APIRouter, HTTPException, status
from app.schemas.cat import CatCreate, CatResponse

router = APIRouter(prefix="/cats", tags=["cats"])


@router.get("/", response_model=list[CatResponse])
async def get_cats():
    return []  # await CatsService.find_all()


@router.get("/{cat_id}", response_model=CatResponse)
async def get_cat(cat_id: int):
    return {  # await CatsService.find_by_id(cat_id)
        "id": cat_id,
        "name": "Minou",
        "age": 3,
    }


@router.post("/", response_model=CatResponse, status_code=status.HTTP_201_CREATED)
async def create_cat(cat: CatCreate):
    return {  # await CatsService.create(cat)
        "id": 1,
        "name": cat.name,
        "age": cat.age,
    }


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cat(cat_id: int):
    pass  # await CatsService.delete(cat_id)
EOF

# Example service
cat > app/services/cats.py << 'EOF'
class CatsService:
    @staticmethod
    async def find_all():
        pass

    @staticmethod
    async def find_by_id(id: int):
        pass

    @staticmethod
    async def create(cat_data):
        pass

    @staticmethod
    async def delete(id: int):
        pass
EOF

# Example models
cat > app/models/cat.py << 'EOF'
# SQLAlchemy model example
# from sqlalchemy import Column, Integer, String
#
# class Cat(Base):
#     __tablename__ = "cats"
#     id = Column(Integer, primary_key=True, autoincrement=True)
#     name = Column(String, nullable=False)
#     age = Column(Integer, nullable=False)
EOF

# Logger utility
cat > app/utils/logger.py << 'EOF'
import logging


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger
EOF

# Pytest example
cat > tests/test_cats.py << 'EOF'
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_cats():
    response = client.get("/cats")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_cat():
    response = client.get("/cats/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Minou"


def test_create_cat():
    response = client.post("/cats", json={"name": "Minou", "age": 3})
    assert response.status_code == 201
    assert response.json()["name"] == "Minou"
EOF

# Update pyproject.toml with ruff config
cat >> pyproject.toml << 'EOF'

[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "N", "UP", "B", "C4", "SIM"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"

[tool.pytest.ini_options]
testpaths = ["tests"]
EOF

echo ""
echo "═══════════════════════════════════════"
echo " FastAPI project '$NAME' created ✓"
echo ""
echo " Next steps:"
echo "   cd $NAME"
echo "   uv run fastapi dev --host 0.0.0.0"
echo "   uv run pytest                    # Run tests"
echo "   uv run ruff check .              # Lint"
echo "   uv run ruff format .             # Format"
echo ""
echo " Docs: /docs (Swagger UI)  /redoc (ReDoc)"
echo ""
echo " Structure follows CoFabNum conventions."
echo " See conventions-cofabnum for full guidelines."
echo "═══════════════════════════════════════"
