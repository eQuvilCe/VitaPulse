"""user body profile

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-30 18:05:00.000000
"""

import sqlalchemy as sa

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("height_cm", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("birth_year", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("sex", sa.String(length=10), nullable=True))
        batch_op.add_column(
            sa.Column("activity", sa.String(length=10), server_default="light", nullable=False)
        )


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("activity")
        batch_op.drop_column("sex")
        batch_op.drop_column("birth_year")
        batch_op.drop_column("height_cm")
