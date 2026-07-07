# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


THRESHOLD_REGISTRY_URL = "https://parametrix-thresholds.netlify.app/thresholds/v1.json"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


ACTIVE = "ACTIVE"
TRIGGERED = "TRIGGERED"
PAID = "PAID"
EXPIRED = "EXPIRED"
CANCELLED = "CANCELLED"

RAINFALL_INDEX = "RAINFALL_INDEX"
TEMPERATURE_INDEX = "TEMPERATURE_INDEX"

SEVERE_EVENT = "SEVERE_EVENT"
EXTREME_EVENT = "EXTREME_EVENT"
CRITICAL_EVENT = "CRITICAL_EVENT"

ONE_GEN = u256(1000000000000000000)

SEVERE_PREMIUM = u256(1000000000000000000)
EXTREME_PREMIUM = u256(2000000000000000000)
CRITICAL_PREMIUM = u256(3000000000000000000)

SEVERE_PAYOUT = u256(3000000000000000000)
EXTREME_PAYOUT = u256(6000000000000000000)
CRITICAL_PAYOUT = u256(10000000000000000000)

WEATHER_SCALE = u256(10)
WEATHER_TOLERANCE_SCALED = u256(2)

POLICY_FIELDS = [
    "policy_id",
    "policyholder",
    "location_id",
    "location_name",
    "country",
    "latitude",
    "longitude",
    "policy_type",
    "event_level",
    "threshold",
    "threshold_unit",
    "threshold_version",
    "weather_variable",
    "coverage_start",
    "coverage_end",
    "duration_days",
    "premium_paid",
    "coverage_limit",
    "payout_amount",
    "status",
    "last_settled_date",
    "triggered_date",
    "paid_at",
    "cancelled_at",
    "created_at",
    "trigger_weather_value",
    "trigger_weather_value_scaled",
    "trigger_weather_unit",
    "trigger_weather_variable",
    "settlement_history",
]


def _loads_json_list(value: str) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if value == "":
        return []
    return json.loads(value)


def _loads_json_object(value: str) -> dict:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if value == "":
        return {}
    return json.loads(value)


def _dumps_json(value) -> str:
    return json.dumps(value, separators=(",", ":"))


def _date_from_datetime(datetime_value: str) -> str:
    return datetime_value[0:10]


def _is_address_whitespace(character: str) -> bool:
    return (
        character == " "
        or character == "\t"
        or character == "\n"
        or character == "\r"
    )


def _trim_address(address: str) -> str:
    start = 0
    end = len(address)

    while start < end and _is_address_whitespace(address[start : start + 1]):
        start += 1

    while end > start and _is_address_whitespace(address[end - 1 : end]):
        end -= 1

    return address[start:end]


def _lower_address_character(character: str) -> str:
    if character == "A":
        return "a"
    if character == "B":
        return "b"
    if character == "C":
        return "c"
    if character == "D":
        return "d"
    if character == "E":
        return "e"
    if character == "F":
        return "f"
    if character == "X":
        return "x"
    return character


def _normalize_address(address: str) -> str:
    if address is None:
        return ""

    trimmed_address = _trim_address(str(address))
    normalized_address = ""

    for character in trimmed_address:
        normalized_address += _lower_address_character(character)

    return normalized_address


def _is_digit_string(value: str) -> bool:
    if value == "":
        return False

    for character in value:
        if character < "0" or character > "9":
            return False

    return True


def _is_hex_character(character: str) -> bool:
    if character >= "0" and character <= "9":
        return True
    if character >= "a" and character <= "f":
        return True
    if character >= "A" and character <= "F":
        return True
    return False


def _is_valid_address(address: str) -> bool:
    normalized_address = _normalize_address(address)

    if len(normalized_address) != 42:
        return False
    if normalized_address[0:2] != "0x":
        return False

    for character in normalized_address[2:42]:
        if not _is_hex_character(character):
            return False

    return True


def _is_leap_year(year: int) -> bool:
    if year % 400 == 0:
        return True
    if year % 100 == 0:
        return False
    return year % 4 == 0


def _days_in_month(year: int, month: int) -> int:
    if month == 2:
        if _is_leap_year(year):
            return 29
        return 28
    if month == 4 or month == 6 or month == 9 or month == 11:
        return 30
    return 31


def _two_digits(value: int) -> str:
    if value < 10:
        return "0" + str(value)
    return str(value)


def _is_valid_date_string(date_value: str) -> bool:
    if len(date_value) != 10:
        return False
    if date_value[4:5] != "-":
        return False
    if date_value[7:8] != "-":
        return False

    year_value = date_value[0:4]
    month_value = date_value[5:7]
    day_value = date_value[8:10]

    if not _is_digit_string(year_value):
        return False
    if not _is_digit_string(month_value):
        return False
    if not _is_digit_string(day_value):
        return False

    year = int(year_value)
    month = int(month_value)
    day = int(day_value)

    if year < 1:
        return False
    if month < 1 or month > 12:
        return False
    if day < 1:
        return False
    if day > _days_in_month(year, month):
        return False

    return True


def _date_to_day_index(date_value: str) -> int:
    year = int(date_value[0:4])
    month = int(date_value[5:7])
    day = int(date_value[8:10])
    years_before = year - 1
    day_index = (
        years_before * 365
        + years_before // 4
        - years_before // 100
        + years_before // 400
    )
    current_month = 1

    while current_month < month:
        day_index += _days_in_month(year, current_month)
        current_month += 1

    return day_index + day


def _compare_dates(left: str, right: str) -> int:
    left_index = _date_to_day_index(left)
    right_index = _date_to_day_index(right)

    if left_index < right_index:
        return -1
    if left_index > right_index:
        return 1
    return 0


def _add_days(date_value: str, days_to_add: int) -> str:
    year = int(date_value[0:4])
    month = int(date_value[5:7])
    day = int(date_value[8:10])
    remaining_days = days_to_add

    while remaining_days > 0:
        current_month_days = _days_in_month(year, month)
        if day < current_month_days:
            day += 1
        else:
            day = 1
            if month == 12:
                month = 1
                year += 1
            else:
                month += 1
        remaining_days -= 1

    return str(year) + "-" + _two_digits(month) + "-" + _two_digits(day)


def _is_allowed_duration_days(duration_days: u256) -> bool:
    return (
        duration_days == u256(7)
        or duration_days == u256(14)
        or duration_days == u256(30)
    )


def _is_allowed_policy_type(policy_type: str) -> bool:
    return policy_type == RAINFALL_INDEX or policy_type == TEMPERATURE_INDEX


def _is_allowed_event_level(event_level: str) -> bool:
    return (
        event_level == SEVERE_EVENT
        or event_level == EXTREME_EVENT
        or event_level == CRITICAL_EVENT
    )


def _get_expected_weather_variable(policy_type: str) -> str:
    if policy_type == RAINFALL_INDEX:
        return "precipitation_sum"
    if policy_type == TEMPERATURE_INDEX:
        return "temperature_2m_max"
    return ""


def _get_expected_unit(policy_type: str) -> str:
    if policy_type == RAINFALL_INDEX:
        return "mm"
    if policy_type == TEMPERATURE_INDEX:
        return "°C"
    return ""


def _get_required_premium_for_event_level(event_level: str) -> u256:
    if event_level == SEVERE_EVENT:
        return SEVERE_PREMIUM
    if event_level == EXTREME_EVENT:
        return EXTREME_PREMIUM
    if event_level == CRITICAL_EVENT:
        return CRITICAL_PREMIUM
    return u256(0)


def _get_payout_for_event_level(event_level: str) -> u256:
    if event_level == SEVERE_EVENT:
        return SEVERE_PAYOUT
    if event_level == EXTREME_EVENT:
        return EXTREME_PAYOUT
    if event_level == CRITICAL_EVENT:
        return CRITICAL_PAYOUT
    return u256(0)


def _contains_policy_id(policy_ids: list, policy_id: str) -> bool:
    for existing_policy_id in policy_ids:
        if existing_policy_id == policy_id:
            return True
    return False


def _remove_policy_id(policy_ids: list, policy_id: str) -> list:
    updated_policy_ids = []
    for existing_policy_id in policy_ids:
        if existing_policy_id != policy_id:
            updated_policy_ids.append(existing_policy_id)
    return updated_policy_ids


def _get_policy_settlement_history(policy: dict) -> list:
    return _loads_json_list(policy.get("settlement_history", "[]"))


def _set_policy_settlement_history(policy: dict, history: list) -> None:
    policy["settlement_history"] = _dumps_json(history)


def _append_settlement_history_record(policy: dict, record: dict) -> None:
    history = _get_policy_settlement_history(policy)
    history.append(record)
    _set_policy_settlement_history(policy, history)


def _find_settlement_history_record(policy: dict, settlement_date: str) -> dict:
    history = _get_policy_settlement_history(policy)
    for record in history:
        if record.get("settlement_date", "") == settlement_date:
            return record
    return {}


def _expected_settlement_date(policy: dict) -> str:
    last_settled_date = policy.get("last_settled_date", "")
    if last_settled_date == "":
        return policy.get("coverage_start", "")

    return _add_days(last_settled_date, 1)


def _response_to_text(response) -> str:
    if isinstance(response, str):
        return response
    if isinstance(response, dict):
        if "body" in response:
            return response["body"]
        if "content" in response:
            return response["content"]
        if "text" in response:
            return response["text"]
        return _dumps_json(response)
    if hasattr(response, "body"):
        return response.body
    if hasattr(response, "content"):
        return response.content
    if hasattr(response, "text"):
        return response.text
    return str(response)


def _to_number(value):
    if isinstance(value, int) or isinstance(value, float):
        return value
    return float(value)


def _scale_weather_value(value) -> u256:
    numeric_value = _to_number(value)
    scaled_value = int((numeric_value * 10) + 0.5)
    return u256(scaled_value)


def _abs_u256_difference(a: u256, b: u256) -> u256:
    if a >= b:
        return a - b
    return b - a


class Parametrix(gl.Contract):
    policies: TreeMap[str, str]
    user_policies: TreeMap[str, str]
    active_policy_ids: str
    policy_count: u256
    capital_pool: u256
    reserved_liability: u256
    owner: str
    settlement_operator: str

    def __init__(self):
        self.policies = TreeMap()
        self.user_policies = TreeMap()
        self.active_policy_ids = "[]"
        self.policy_count = u256(0)
        self.capital_pool = u256(0)
        self.reserved_liability = u256(0)
        self.owner = _normalize_address(str(gl.message.sender_address))
        self.settlement_operator = self.owner

    @gl.public.view
    def get_policy(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            return ""
        return policy_json

    @gl.public.view
    def get_my_policies(self) -> str:
        owner = _normalize_address(str(gl.message.sender_address))
        owner_policy_ids = self.user_policies.get(owner)
        if owner_policy_ids is None:
            return "[]"
        return owner_policy_ids

    @gl.public.view
    def get_policies_by_owner(self, owner: str) -> str:
        normalized_owner = _normalize_address(owner)
        owner_policy_ids = self.user_policies.get(normalized_owner)
        if owner_policy_ids is None:
            return "[]"
        return owner_policy_ids

    @gl.public.view
    def get_active_policies(self) -> str:
        return self.active_policy_ids

    @gl.public.view
    def get_pool_status(self) -> str:
        available_capacity = self.capital_pool - self.reserved_liability
        return _dumps_json(
            {
                "capital_pool": str(self.capital_pool),
                "reserved_liability": str(self.reserved_liability),
                "available_capacity": str(available_capacity),
            }
        )

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner

    @gl.public.view
    def get_settlement_operator(self) -> str:
        return self.settlement_operator

    @gl.public.write
    def set_settlement_operator(self, operator_address: str) -> str:
        caller = _normalize_address(str(gl.message.sender_address))
        if caller != self.owner:
            raise gl.vm.UserError("only owner can set settlement operator")
        normalized_operator_address = _normalize_address(operator_address)
        if normalized_operator_address == "":
            raise gl.vm.UserError("invalid_settlement_operator")
        if not _is_valid_address(normalized_operator_address):
            raise gl.vm.UserError("invalid_settlement_operator")

        self.settlement_operator = normalized_operator_address
        return self.settlement_operator

    @gl.public.view
    def get_last_policy_id(self) -> str:
        if self.policy_count == u256(0):
            return ""
        return str(self.policy_count - u256(1))

    @gl.public.view
    def get_policy_owner(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            return ""
        policy = _loads_json_object(policy_json)
        return policy.get("policyholder", "")

    @gl.public.view
    def get_policy_summary(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            return ""

        policy = _loads_json_object(policy_json)
        return _dumps_json(
            {
                "policy_id": policy.get("policy_id", ""),
                "policyholder": policy.get("policyholder", ""),
                "location_id": policy.get("location_id", ""),
                "location_name": policy.get("location_name", ""),
                "country": policy.get("country", ""),
                "policy_type": policy.get("policy_type", ""),
                "event_level": policy.get("event_level", ""),
                "threshold": policy.get("threshold", ""),
                "threshold_unit": policy.get("threshold_unit", ""),
                "weather_variable": policy.get("weather_variable", ""),
                "coverage_start": policy.get("coverage_start", ""),
                "coverage_end": policy.get("coverage_end", ""),
                "duration_days": policy.get("duration_days", ""),
                "premium_paid": policy.get("premium_paid", ""),
                "payout_amount": policy.get("payout_amount", ""),
                "status": policy.get("status", ""),
            }
        )

    @gl.public.view
    def get_policy_settlement_status(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            return ""

        policy = _loads_json_object(policy_json)
        return _dumps_json(
            {
                "policy_id": policy.get("policy_id", ""),
                "status": policy.get("status", ""),
                "last_settled_date": policy.get("last_settled_date", ""),
                "coverage_start": policy.get("coverage_start", ""),
                "coverage_end": policy.get("coverage_end", ""),
                "triggered_date": policy.get("triggered_date", ""),
                "trigger_weather_value": policy.get("trigger_weather_value", ""),
                "trigger_weather_value_scaled": policy.get(
                    "trigger_weather_value_scaled",
                    "",
                ),
                "trigger_weather_unit": policy.get("trigger_weather_unit", ""),
                "trigger_weather_variable": policy.get("trigger_weather_variable", ""),
                "paid_at": policy.get("paid_at", ""),
                "cancelled_at": policy.get("cancelled_at", ""),
            }
        )

    @gl.public.view
    def get_policy_settlement_history(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            return "[]"

        policy = _loads_json_object(policy_json)
        return policy.get("settlement_history", "[]")

    @gl.public.view
    def get_policy_financials(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            return ""

        policy = _loads_json_object(policy_json)
        status = policy.get("status", "")
        paid_at = policy.get("paid_at", "")
        return _dumps_json(
            {
                "policy_id": policy.get("policy_id", ""),
                "premium_paid": policy.get("premium_paid", ""),
                "coverage_limit": policy.get("coverage_limit", ""),
                "payout_amount": policy.get("payout_amount", ""),
                "status": status,
                "is_claimable": status == TRIGGERED and paid_at == "",
                "is_paid": status == PAID or paid_at != "",
            }
        )

    @gl.public.view
    def get_settlement_readiness(self, policy_id: str, settlement_date: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            return _dumps_json(
                {
                    "can_settle": False,
                    "coverage_end": "",
                    "coverage_start": "",
                    "expected_settlement_date": "",
                    "exists": False,
                    "is_ready": False,
                    "last_settled_date": "",
                    "policy_id": policy_id,
                    "reason": "policy_not_found",
                    "requested_settlement_date": settlement_date,
                    "settlement_date": settlement_date,
                    "status": "",
                }
            )

        policy = _loads_json_object(policy_json)
        status = policy.get("status", "")
        last_settled_date = policy.get("last_settled_date", "")
        coverage_start = policy.get("coverage_start", "")
        coverage_end = policy.get("coverage_end", "")
        expected_settlement_date = _expected_settlement_date(policy)
        is_ready = False
        reason = ""

        if status != ACTIVE:
            reason = "policy_not_active"
        elif not _is_valid_date_string(settlement_date):
            reason = "invalid_date_format"
        elif settlement_date == last_settled_date:
            reason = "already_settled_for_date"
        elif _find_settlement_history_record(policy, settlement_date) != {}:
            reason = "already_settled_for_date"
        elif _compare_dates(settlement_date, coverage_start) < 0:
            reason = "settlement_before_coverage_start"
        elif _compare_dates(settlement_date, coverage_end) > 0:
            reason = "settlement_after_coverage_end"
        elif settlement_date != expected_settlement_date:
            reason = "settlement_date_not_expected"
        else:
            is_ready = True
            reason = "ready"

        return _dumps_json(
            {
                "can_settle": is_ready,
                "coverage_end": coverage_end,
                "coverage_start": coverage_start,
                "expected_settlement_date": expected_settlement_date,
                "exists": True,
                "is_ready": is_ready,
                "last_settled_date": last_settled_date,
                "policy_id": policy.get("policy_id", ""),
                "reason": reason,
                "requested_settlement_date": settlement_date,
                "settlement_date": settlement_date,
                "status": status,
            }
        )

    @gl.public.write.payable
    def add_pool_funds(self) -> str:
        amount = gl.message.value
        if amount == u256(0):
            raise gl.vm.UserError("No GEN sent")

        self.capital_pool += amount
        return self.get_pool_status()

    @gl.public.write
    def withdraw_from_pool(self, amount_gen: u256) -> str:
        caller = _normalize_address(str(gl.message.sender_address))
        if caller != self.owner:
            raise gl.vm.UserError("only owner can withdraw")
        if amount_gen == u256(0):
            raise gl.vm.UserError("amount must be greater than zero")

        amount = amount_gen * ONE_GEN
        available_capacity = self.capital_pool - self.reserved_liability
        if amount > available_capacity:
            raise gl.vm.UserError("cannot withdraw reserved liability")

        self.capital_pool -= amount
        _Recipient(Address(caller)).emit_transfer(value=amount)
        return self.get_pool_status()

    @gl.public.write.payable
    def purchase_policy(
        self,
        location_id: str,
        policy_type: str,
        event_level: str,
        duration_days: u256,
    ) -> str:
        caller = _normalize_address(str(gl.message.sender_address))
        premium_paid = gl.message.value
        required_premium = _get_required_premium_for_event_level(event_level)
        payout_amount = _get_payout_for_event_level(event_level)
        coverage_limit = payout_amount
        created_at = gl.message_raw["datetime"]

        submitted_location_id = location_id
        submitted_policy_type = policy_type
        submitted_event_level = event_level
        submitted_duration_days = duration_days
        submitted_premium_paid = premium_paid
        submitted_coverage_limit = coverage_limit
        submitted_payout_amount = payout_amount
        submitted_created_at = created_at
        submitted_duration_days_int = 7

        if submitted_premium_paid == u256(0):
            raise gl.vm.UserError("No GEN sent")
        if not _is_allowed_policy_type(submitted_policy_type):
            raise gl.vm.UserError("invalid policy type")
        if not _is_allowed_event_level(submitted_event_level):
            raise gl.vm.UserError("invalid event level")
        if required_premium == u256(0):
            raise gl.vm.UserError("invalid event level")
        if submitted_payout_amount == u256(0):
            raise gl.vm.UserError("invalid event payout")
        if submitted_premium_paid != required_premium:
            raise gl.vm.UserError("incorrect premium for event level")
        if not _is_allowed_duration_days(submitted_duration_days):
            raise gl.vm.UserError("invalid coverage duration")

        if submitted_duration_days == u256(14):
            submitted_duration_days_int = 14
        if submitted_duration_days == u256(30):
            submitted_duration_days_int = 30

        submitted_coverage_start = _date_from_datetime(submitted_created_at)
        submitted_coverage_end = _add_days(
            submitted_coverage_start,
            submitted_duration_days_int - 1,
        )

        available_capacity = self.capital_pool - self.reserved_liability
        if available_capacity < submitted_coverage_limit:
            raise gl.vm.UserError("insufficient capital pool capacity")

        def fetch_selected_policy_terms():
            response = gl.nondet.web.get(THRESHOLD_REGISTRY_URL)
            registry = _loads_json_object(_response_to_text(response))

            if registry.get("version") != "v1":
                raise Exception("unsupported threshold registry version")

            locations = registry.get("locations", {})
            if submitted_location_id not in locations:
                raise Exception("location not found in threshold registry")

            location = locations[submitted_location_id]
            location_policies = location.get("policies", {})
            if submitted_policy_type not in location_policies:
                raise Exception("policy type not available for location")

            registry_policy = location_policies[submitted_policy_type]
            events = registry_policy.get("events", {})
            if submitted_event_level not in events:
                raise Exception("event level not available for policy type")

            threshold = events[submitted_event_level]
            selected_terms = {
                "registry_version": registry.get("version", ""),
                "location_id": location.get("location_id", ""),
                "location_name": location.get("name", ""),
                "country": location.get("country", ""),
                "latitude": str(location.get("latitude", "")),
                "longitude": str(location.get("longitude", "")),
                "policy_type": submitted_policy_type,
                "event_level": submitted_event_level,
                "threshold": str(threshold),
                "unit": registry_policy.get("unit", ""),
                "weather_variable": registry_policy.get("weather_variable", ""),
            }
            return _dumps_json(selected_terms)

        selected_terms_json = gl.eq_principle.strict_eq(fetch_selected_policy_terms)
        selected_terms = _loads_json_object(selected_terms_json)

        if selected_terms.get("registry_version") != "v1":
            raise gl.vm.UserError("unsupported threshold registry version")
        if selected_terms.get("location_id") != submitted_location_id:
            raise gl.vm.UserError("location mismatch")
        if selected_terms.get("policy_type") != submitted_policy_type:
            raise gl.vm.UserError("policy type mismatch")
        if selected_terms.get("event_level") != submitted_event_level:
            raise gl.vm.UserError("event level mismatch")

        expected_weather_variable = _get_expected_weather_variable(submitted_policy_type)
        expected_unit = _get_expected_unit(submitted_policy_type)

        if selected_terms.get("weather_variable") != expected_weather_variable:
            raise gl.vm.UserError("unexpected weather variable")
        if selected_terms.get("unit") != expected_unit:
            raise gl.vm.UserError("unexpected threshold unit")

        official_threshold = u256(int(selected_terms.get("threshold")))

        policy_id = str(self.policy_count)
        policy = {
            "policy_id": policy_id,
            "policyholder": caller,
            "location_id": selected_terms.get("location_id", ""),
            "location_name": selected_terms.get("location_name", ""),
            "country": selected_terms.get("country", ""),
            "latitude": selected_terms.get("latitude", ""),
            "longitude": selected_terms.get("longitude", ""),
            "policy_type": submitted_policy_type,
            "event_level": submitted_event_level,
            "threshold": str(official_threshold),
            "threshold_unit": selected_terms.get("unit", ""),
            "threshold_version": selected_terms.get("registry_version", ""),
            "weather_variable": selected_terms.get("weather_variable", ""),
            "coverage_start": submitted_coverage_start,
            "coverage_end": submitted_coverage_end,
            "duration_days": str(submitted_duration_days),
            "premium_paid": str(submitted_premium_paid),
            "coverage_limit": str(submitted_coverage_limit),
            "payout_amount": str(submitted_payout_amount),
            "status": ACTIVE,
            "last_settled_date": "",
            "triggered_date": "",
            "paid_at": "",
            "cancelled_at": "",
            "created_at": submitted_created_at,
            "trigger_weather_value": "",
            "trigger_weather_value_scaled": "",
            "trigger_weather_unit": "",
            "trigger_weather_variable": "",
            "settlement_history": "[]",
        }

        self.policies[policy_id] = _dumps_json(policy)

        user_policy_ids_json = self.user_policies.get(caller)
        user_policy_ids = []
        if user_policy_ids_json is not None:
            user_policy_ids = _loads_json_list(user_policy_ids_json)
        if not _contains_policy_id(user_policy_ids, policy_id):
            user_policy_ids.append(policy_id)
        self.user_policies[caller] = _dumps_json(user_policy_ids)

        active_policy_ids = _loads_json_list(self.active_policy_ids)
        if not _contains_policy_id(active_policy_ids, policy_id):
            active_policy_ids.append(policy_id)
        self.active_policy_ids = _dumps_json(active_policy_ids)

        self.policy_count += u256(1)
        self.capital_pool += submitted_premium_paid
        self.reserved_liability += submitted_coverage_limit

        return policy_id

    @gl.public.write
    def cancel_policy(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            raise gl.vm.UserError("policy not found")

        policy = _loads_json_object(policy_json)
        caller = _normalize_address(str(gl.message.sender_address))
        policyholder = _normalize_address(policy["policyholder"])

        if caller != policyholder:
            raise gl.vm.UserError("only policyholder can cancel policy")
        if policy["status"] != ACTIVE:
            raise gl.vm.UserError("only active policies can be cancelled")

        coverage_limit = u256(int(policy["coverage_limit"]))

        if self.reserved_liability < coverage_limit:
            raise gl.vm.UserError("reserved liability underflow")

        policy["status"] = CANCELLED
        policy["cancelled_at"] = gl.message_raw["datetime"]

        active_policy_ids = _loads_json_list(self.active_policy_ids)
        self.active_policy_ids = _dumps_json(_remove_policy_id(active_policy_ids, policy_id))
        self.reserved_liability -= coverage_limit

        self.policies[policy_id] = _dumps_json(policy)
        return CANCELLED

    @gl.public.write
    def settle_policy_day(self, policy_id: str, settlement_date: str) -> str:
        caller = _normalize_address(str(gl.message.sender_address))
        if caller != self.owner and caller != self.settlement_operator:
            raise gl.vm.UserError("unauthorized_settlement_operator")

        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            raise gl.vm.UserError("policy not found")
        if not _is_valid_date_string(settlement_date):
            raise gl.vm.UserError("invalid_date_format")

        policy = _loads_json_object(policy_json)
        previous_status = policy["status"]

        stored_policy_id = policy["policy_id"]
        stored_policy_type = policy["policy_type"]
        stored_weather_variable = policy["weather_variable"]
        stored_threshold = policy["threshold"]
        stored_unit = policy["threshold_unit"]
        stored_latitude = policy["latitude"]
        stored_longitude = policy["longitude"]
        stored_coverage_start = policy["coverage_start"]
        stored_coverage_end = policy["coverage_end"]
        expected_settlement_date = _expected_settlement_date(policy)
        threshold_scaled = _scale_weather_value(stored_threshold)

        def build_settlement_response(
            final_status: str,
            weather_value: str,
            weather_value_scaled: str,
            triggered: bool,
            expired_reason: str,
        ) -> str:
            return _dumps_json(
                {
                    "policy_id": stored_policy_id,
                    "settlement_date": settlement_date,
                    "coverage_start": stored_coverage_start,
                    "coverage_end": stored_coverage_end,
                    "previous_status": previous_status,
                    "final_status": final_status,
                    "policy_type": stored_policy_type,
                    "weather_variable": stored_weather_variable,
                    "weather_value": weather_value,
                    "weather_value_scaled": weather_value_scaled,
                    "threshold_scaled": str(threshold_scaled),
                    "unit": stored_unit,
                    "triggered": triggered,
                    "expired_reason": expired_reason,
                }
            )

        def build_settlement_history_record(
            final_status: str,
            weather_value: str,
            weather_value_scaled: str,
            triggered: bool,
            expired_reason: str,
        ) -> dict:
            return {
                "policy_id": stored_policy_id,
                "settlement_date": settlement_date,
                "policy_type": stored_policy_type,
                "weather_variable": stored_weather_variable,
                "weather_value": weather_value,
                "weather_value_scaled": weather_value_scaled,
                "threshold_scaled": str(threshold_scaled),
                "unit": stored_unit,
                "triggered": triggered,
                "final_status": final_status,
                "expired_reason": expired_reason,
            }

        if policy["last_settled_date"] == settlement_date:
            raise gl.vm.UserError("already_settled_for_date")

        if previous_status != ACTIVE:
            raise gl.vm.UserError("policy_not_active")

        coverage_limit = u256(int(policy["coverage_limit"]))

        if _find_settlement_history_record(policy, settlement_date) != {}:
            raise gl.vm.UserError("already_settled_for_date")

        if _compare_dates(settlement_date, stored_coverage_start) < 0:
            raise gl.vm.UserError("settlement_before_coverage_start")

        if _compare_dates(settlement_date, stored_coverage_end) > 0:
            raise gl.vm.UserError("settlement_after_coverage_end")

        if settlement_date != expected_settlement_date:
            raise gl.vm.UserError("settlement_date_not_expected")

        requested_settlement_date = settlement_date

        open_meteo_url = (
            OPEN_METEO_ARCHIVE_URL
            + "?latitude="
            + stored_latitude
            + "&longitude="
            + stored_longitude
            + "&start_date="
            + requested_settlement_date
            + "&end_date="
            + requested_settlement_date
            + "&daily="
            + stored_weather_variable
            + "&timezone=UTC&wind_speed_unit=kmh"
        )

        def fetch_settlement_result():
            response = gl.nondet.web.get(open_meteo_url)
            weather_data = _loads_json_object(_response_to_text(response))
            daily = weather_data.get("daily", {})
            values = daily.get(stored_weather_variable, [])
            if len(values) == 0:
                raise Exception("weather value missing")
            raw_weather_value = values[0]
            weather_value_scaled = _scale_weather_value(raw_weather_value)
            return _dumps_json(
                {
                    "policy_id": stored_policy_id,
                    "settlement_date": requested_settlement_date,
                    "policy_type": stored_policy_type,
                    "weather_variable": stored_weather_variable,
                    "weather_value": str(raw_weather_value),
                    "weather_value_scaled": str(weather_value_scaled),
                    "threshold_scaled": str(threshold_scaled),
                    "unit": stored_unit,
                    "triggered": weather_value_scaled >= threshold_scaled,
                }
            )

        def validate_settlement_result(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False

            settlement = _loads_json_object(leaders_res.calldata)
            if settlement.get("policy_id") != stored_policy_id:
                raise Exception("settlement policy mismatch")
            if settlement.get("settlement_date") != requested_settlement_date:
                raise Exception("settlement date mismatch")
            if settlement.get("policy_type") != stored_policy_type:
                raise Exception("settlement policy type mismatch")
            if settlement.get("weather_variable") != stored_weather_variable:
                raise Exception("weather variable mismatch")
            if settlement.get("unit") != stored_unit:
                raise Exception("settlement unit mismatch")

            leader_weather_value_scaled = u256(int(settlement.get("weather_value_scaled")))
            leader_threshold_scaled = u256(int(settlement.get("threshold_scaled")))
            stored_threshold_scaled = _scale_weather_value(stored_threshold)

            if leader_threshold_scaled != stored_threshold_scaled:
                raise Exception("threshold mismatch")

            validator_response = gl.nondet.web.get(open_meteo_url)
            validator_weather_data = _loads_json_object(_response_to_text(validator_response))
            validator_daily = validator_weather_data.get("daily", {})
            validator_values = validator_daily.get(stored_weather_variable, [])
            if len(validator_values) == 0:
                raise Exception("validator weather value missing")

            validator_weather_value_scaled = _scale_weather_value(validator_values[0])
            validator_triggered = validator_weather_value_scaled >= stored_threshold_scaled
            leader_triggered = settlement.get("triggered")

            if leader_triggered != validator_triggered:
                raise Exception("trigger decision mismatch")

            difference = _abs_u256_difference(
                leader_weather_value_scaled,
                validator_weather_value_scaled,
            )
            if difference > WEATHER_TOLERANCE_SCALED:
                raise Exception("weather value outside tolerance")

            return True

        settlement_result_json = gl.vm.run_nondet_unsafe(
            fetch_settlement_result,
            validate_settlement_result,
        )
        settlement_result = _loads_json_object(settlement_result_json)

        weather_value = settlement_result["weather_value"]
        weather_value_scaled = u256(int(settlement_result["weather_value_scaled"]))
        triggered = weather_value_scaled >= threshold_scaled

        policy["last_settled_date"] = settlement_date

        # Settlement uses the policy's stored threshold. Existing policies do
        # not refetch the threshold registry after purchase.
        if triggered:
            policy["status"] = TRIGGERED
            policy["triggered_date"] = settlement_date
            policy["trigger_weather_value"] = weather_value
            policy["trigger_weather_value_scaled"] = str(weather_value_scaled)
            policy["trigger_weather_unit"] = policy["threshold_unit"]
            policy["trigger_weather_variable"] = policy["weather_variable"]
            active_policy_ids = _loads_json_list(self.active_policy_ids)
            self.active_policy_ids = _dumps_json(_remove_policy_id(active_policy_ids, policy_id))
            _append_settlement_history_record(
                policy,
                build_settlement_history_record(
                    TRIGGERED,
                    weather_value,
                    str(weather_value_scaled),
                    True,
                    "",
                ),
            )
            self.policies[policy_id] = _dumps_json(policy)
            return build_settlement_response(
                TRIGGERED,
                weather_value,
                str(weather_value_scaled),
                True,
                "",
            )

        if settlement_date == stored_coverage_end:
            policy["status"] = EXPIRED
            active_policy_ids = _loads_json_list(self.active_policy_ids)
            self.active_policy_ids = _dumps_json(_remove_policy_id(active_policy_ids, policy_id))
            if self.reserved_liability < coverage_limit:
                raise gl.vm.UserError("reserved liability underflow")
            self.reserved_liability -= coverage_limit
            _append_settlement_history_record(
                policy,
                build_settlement_history_record(
                    EXPIRED,
                    weather_value,
                    str(weather_value_scaled),
                    False,
                    "final_covered_day_no_trigger",
                ),
            )
            self.policies[policy_id] = _dumps_json(policy)
            return build_settlement_response(
                EXPIRED,
                weather_value,
                str(weather_value_scaled),
                False,
                "final_covered_day_no_trigger",
            )

        _append_settlement_history_record(
            policy,
            build_settlement_history_record(
                ACTIVE,
                weather_value,
                str(weather_value_scaled),
                False,
                "",
            ),
        )
        self.policies[policy_id] = _dumps_json(policy)
        return build_settlement_response(
            ACTIVE,
            weather_value,
            str(weather_value_scaled),
            False,
            "",
        )

    @gl.public.write
    def claim_payout(self, policy_id: str) -> str:
        policy_json = self.policies.get(policy_id)
        if policy_json is None:
            raise gl.vm.UserError("policy not found")

        policy = _loads_json_object(policy_json)
        caller = _normalize_address(str(gl.message.sender_address))
        policyholder = _normalize_address(policy["policyholder"])

        if caller != policyholder:
            raise gl.vm.UserError("only policyholder can claim payout")
        if policy["status"] != TRIGGERED:
            raise gl.vm.UserError("policy is not triggered")
        if policy["paid_at"] != "":
            raise gl.vm.UserError("policy already paid")

        payout_amount = u256(int(policy["payout_amount"]))
        coverage_limit = u256(int(policy["coverage_limit"]))
        paid_at = gl.message_raw["datetime"]

        if self.capital_pool < payout_amount:
            raise gl.vm.UserError("insufficient capital pool")
        if self.reserved_liability < coverage_limit:
            raise gl.vm.UserError("reserved liability underflow")

        _Recipient(Address(policyholder)).emit_transfer(value=payout_amount)

        policy["status"] = PAID
        policy["paid_at"] = paid_at

        self.capital_pool -= payout_amount
        self.reserved_liability -= coverage_limit

        self.policies[policy_id] = _dumps_json(policy)
        return str(payout_amount)
