import pytest
from app.services.event_service import _generate_safe_slug

@pytest.mark.asyncio
async def test_slug_generation_basic():
    slug = await _generate_safe_slug("My Awesome Event")
    assert "my-awesome-event-" in slug
    assert len(slug.split("-")[-1]) == 4

@pytest.mark.asyncio
async def test_slug_generation_special_chars():
    slug = await _generate_safe_slug("AI & ML Workshop!!!")
    assert "ai-ml-workshop-" in slug
    assert "!!!" not in slug
    assert "&" not in slug

@pytest.mark.asyncio
async def test_slug_generation_multiple_spaces():
    slug = await _generate_safe_slug("Hello    World")
    assert "hello-world-" in slug
    assert "  " not in slug
