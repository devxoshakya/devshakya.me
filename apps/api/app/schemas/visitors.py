from pydantic import BaseModel


class VisitorOut(BaseModel):
    total_visitors: int
