from datetime import date, timedelta


def is_future(day: date) -> bool:
    """True if `day` is later than tomorrow.

    One day of slack, since the client's calendar day can be ahead of the server's.
    """
    return day > date.today() + timedelta(days=1)
