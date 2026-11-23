from sqlalchemy import Date, Numeric
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Text,
    DateTime,
    ForeignKey,
    func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from database import Base


# ==========================================
# 1. EMPLOYEES TABLE
# ==========================================

class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    department = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    user_account = relationship(
        "UserAccount",
        back_populates="employee",
        uselist=False
    )

    face_profile = relationship(
        "FaceProfile",
        back_populates="employee",
        uselist=False
    )


# ==========================================
# 2. USER ACCOUNTS TABLE
# ==========================================

class UserAccount(Base):
    __tablename__ = "user_accounts"

    account_id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False,
        unique=True
    )

    username = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="employee")

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    employee = relationship(
        "Employee",
        back_populates="user_account"
    )


# ==========================================
# 3. FACE PROFILES TABLE
# ==========================================

class FaceProfile(Base):
    __tablename__ = "face_profiles"

    face_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False,
        unique=True
    )

    embedding = Column(JSONB, nullable=False)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    employee = relationship(
        "Employee",
        back_populates="face_profile"
    )


class Attendance(Base):
    __tablename__ = "attendance"

    attendance_id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False
    )

    attendance_date = Column(
        Date,
        nullable=False
    )

    check_in = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    check_out = Column(
        DateTime(timezone=True),
        nullable=True
    )

    check_in_latitude = Column(Numeric(10, 7), nullable=False)
    check_in_longitude = Column(Numeric(10, 7), nullable=False)
    check_in_accuracy = Column(Numeric(8, 2), nullable=True)

    check_out_latitude = Column(Numeric(10, 7), nullable=True)
    check_out_longitude = Column(Numeric(10, 7), nullable=True)
    check_out_accuracy = Column(Numeric(8, 2), nullable=True)

    attendance_status = Column(
        String(20),
        nullable=False,
        server_default="hadir"
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    employee = relationship("Employee")
