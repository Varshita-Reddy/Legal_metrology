from typing import Dict, Any, Tuple, Optional

class BaseRule:
    def __init__(
        self,
        rule_id: str,
        field: str,
        description: str,
        required: bool = True,
        applicability: str = "All Packaged Commodities",
        severity: str = "HIGH", # HIGH, MEDIUM, LOW
        reference: str = "Legal Metrology (Packaged Commodities) Rules, 2011"
    ):
        self.rule_id = rule_id
        self.field = field
        self.description = description
        self.required = required
        self.applicability = applicability
        self.severity = severity
        self.reference = reference

    def validate(self, extracted_data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Validates extracted field data against the legal metrology rule.
        Returns: (is_valid: bool, issue: str | None, recommendation: str | None)
        """
        field_info = extracted_data.get(self.field, {})
        val = str(field_info.get("value", "")).strip()
        status = field_info.get("status", "Missing")

        if not val or status == "Missing":
            if self.required:
                return (
                    False,
                    f"Mandatory declaration '{self.field}' was not detected on the package label.",
                    f"Check package label manually for '{self.field}'. If missing, issue statutory notice under {self.reference}."
                )
            return (True, None, None)

        if status == "Low Confidence":
            return (
                False,
                f"Declaration '{self.field}' detected with low OCR confidence or partially illegible text.",
                f"Perform physical visual inspection of '{self.field}' on the container to verify accuracy."
            )

        return (True, None, None)
