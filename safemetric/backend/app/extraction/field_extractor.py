import re
from typing import Dict, Any, List
from app.extraction.normalizer import normalize_text, clean_value

class FieldExtractor:
    """
    Robust rule-based and regex-driven declaration extractor specifically tuned for
    Indian packaged commodities under the Legal Metrology (Packaged Commodities) Rules, 2011.
    """

    def extract_declarations(self, raw_text: str, bounding_boxes: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        normalized = normalize_text(raw_text)
        lines = [l.strip() for l in normalized.splitlines() if l.strip()]
        
        extracted: Dict[str, Dict[str, Any]] = {}

        # 1. Product Name (often top 1-2 lines or explicit line)
        product_name = self._extract_product_name(lines)
        extracted["product_name"] = product_name

        # 2. Maximum Retail Price (MRP)
        mrp_data = self._extract_mrp(raw_text, lines)
        extracted["mrp"] = mrp_data

        # 3. Net Quantity
        net_qty_data = self._extract_net_quantity(raw_text, lines)
        extracted["net_quantity"] = net_qty_data

        # 4. Dates: Manufacturing, Packing, Best Before, Use By
        date_data = self._extract_dates(raw_text, lines)
        extracted.update(date_data)

        # 5. Manufacturer / Packer / Importer Name & Designation
        mfg_data = self._extract_manufacturer(raw_text, lines)
        extracted.update(mfg_data)

        # 6. Address
        address_data = self._extract_address(raw_text, lines)
        extracted["manufacturer_address"] = address_data

        # 7. Consumer Care Details
        consumer_care_data = self._extract_consumer_care(raw_text, lines)
        extracted["consumer_care"] = consumer_care_data

        # 8. Country of Origin
        country_data = self._extract_country_of_origin(raw_text, lines)
        extracted["country_of_origin"] = country_data

        # 9. Batch / Lot Number
        batch_data = self._extract_batch_number(raw_text, lines)
        extracted["batch_number"] = batch_data

        return extracted

    def _extract_product_name(self, lines: List[str]) -> Dict[str, Any]:
        # If top line doesn't start with keywords like "Net", "MRP", "Mfg", it is typically the product title
        for line in lines[:3]:
            lower = line.lower()
            if not any(k in lower for k in ["net", "mrp", "rs.", "mfg", "packed", "date", "batch", "address", "safemetric"]):
                if len(line) > 3:
                    return {"value": line, "confidence": 96.0, "status": "Found"}
        return {"value": lines[0] if lines else "Packaged Commodity", "confidence": 75.0, "status": "Found"}

    def _extract_mrp(self, raw_text: str, lines: List[str]) -> Dict[str, Any]:
        # Find line containing MRP or Maximum Retail Price
        mrp_line = ""
        for line in lines:
            if re.search(r'\b(?:mrp|maximum\s+retail\s+price|max\s+retail\s+price)\b', line, re.IGNORECASE):
                mrp_line = line
                break

        # Check for numeric price
        num_match = re.search(r'(?:mrp|maximum\s+retail\s+price|max\s+retail\s+price)[\s.:₹]*(?:rs\.?|inr)?[\s]*([0-9]+(?:\.[0-9]{1,2})?)', raw_text, re.IGNORECASE)
        if not num_match and mrp_line:
            nums = re.findall(r'\b[0-9]+(?:\.[0-9]{1,2})?\b', mrp_line)
            if nums:
                num = nums[0]
                has_tax = bool(re.search(r'(?:incl|inclusive|tax)', mrp_line, re.IGNORECASE))
                has_currency = bool(re.search(r'(?:₹|rs\.?|inr)', mrp_line, re.IGNORECASE))
                display = f"₹ {num} (Incl. of all taxes)" if has_tax else f"₹ {num}"
                return {
                    "value": display,
                    "confidence": 92.0,
                    "status": "Found",
                    "raw": mrp_line,
                    "has_tax": has_tax,
                    "has_currency": has_currency
                }

        if num_match:
            num = num_match.group(1).strip()
            search_context = mrp_line if mrp_line else raw_text
            has_tax = bool(re.search(r'(?:incl|inclusive|tax)', search_context, re.IGNORECASE))
            has_currency = bool(re.search(r'(?:₹|rs\.?|inr)', mrp_line or num_match.group(0), re.IGNORECASE))
            display = f"₹ {num} (Incl. of all taxes)" if has_tax else f"₹ {num}"
            raw_val = mrp_line or num_match.group(0)
            return {
                "value": display,
                "confidence": 98.0,
                "status": "Found",
                "raw": raw_val,
                "has_tax": has_tax,
                "has_currency": has_currency
            }

        return {"value": "", "confidence": 0.0, "status": "Missing", "raw": "", "has_tax": False, "has_currency": False}

    def _extract_net_quantity(self, raw_text: str, lines: List[str]) -> Dict[str, Any]:
        # Regex for Net Quantity: "Net Quantity: 500 g", "Net Qty: 1 kg", "Net Wt: 200g", "Volume: 1 Litre"
        qty_regex = r'(?:net\s*(?:quantity|qty|weight|wt|volume|vol|content)|volume)[\s.:]*([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|kg|kilogram|ml|l|ltr|litre|litres|oz|lb|pieces|units|items|approx\s*[0-9]+g))\b'
        
        match = re.search(qty_regex, raw_text, re.IGNORECASE)
        if match:
            val = clean_value(match.group(1))
            return {"value": val, "confidence": 98.0, "status": "Found"}

        # Standalone weight/volume search
        standalone = re.search(r'\b([0-9]+(?:\.[0-9]+)?\s*(?:kg|kilogram|g|gm|ml|ltr|litre))\b', raw_text, re.IGNORECASE)
        if standalone:
            return {"value": standalone.group(1), "confidence": 82.0, "status": "Found"}

        return {"value": "", "confidence": 0.0, "status": "Missing"}

    def _extract_dates(self, raw_text: str, lines: List[str]) -> Dict[str, Dict[str, Any]]:
        results = {
            "manufacturing_date": {"value": "", "confidence": 0.0, "status": "Missing"},
            "packing_date": {"value": "", "confidence": 0.0, "status": "Missing"},
            "best_before": {"value": "", "confidence": 0.0, "status": "Missing"},
            "use_by": {"value": "", "confidence": 0.0, "status": "Missing"},
        }

        # Date pattern (MM/YYYY, DD/MM/YYYY, MM/YY, Month Year)
        date_pattern = r'([0-9]{1,2}[\/\-\.][0-9]{4}|[0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\.\-]+[0-9]{4})'

        # Mfg Date
        mfg_match = re.search(r'(?:mfg(?:\s*date)?|manufactured(?:\s*on)?|manufacturing\s*date)[\s.:]*' + date_pattern, raw_text, re.IGNORECASE)
        if mfg_match:
            results["manufacturing_date"] = {"value": clean_value(mfg_match.group(1)), "confidence": 96.0, "status": "Found"}

        # Packing Date
        pkd_match = re.search(r'(?:pkd|packed(?:\s*on)?|packing\s*date)[\s.:]*' + date_pattern, raw_text, re.IGNORECASE)
        if pkd_match:
            results["packing_date"] = {"value": clean_value(pkd_match.group(1)), "confidence": 95.0, "status": "Found"}

        # Best Before
        bb_match = re.search(r'(?:best\s*before|expiry|exp(?:\s*date)?|use\s*before)[\s.:]*([0-9]{1,2}[\/\-\.][0-9]{4}|[0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]+\s*months?(?:\s*from\s*(?:packaging|pkd|mfg))?)', raw_text, re.IGNORECASE)
        if bb_match:
            results["best_before"] = {"value": clean_value(bb_match.group(1)), "confidence": 96.0, "status": "Found"}

        # Use By
        use_by_match = re.search(r'(?:use\s*by)[\s.:]*' + date_pattern, raw_text, re.IGNORECASE)
        if use_by_match:
            results["use_by"] = {"value": clean_value(use_by_match.group(1)), "confidence": 95.0, "status": "Found"}

        return results

    def _extract_manufacturer(self, raw_text: str, lines: List[str]) -> Dict[str, Dict[str, Any]]:
        mfg_name = ""
        role = "Manufactured By"
        confidence = 0.0

        for line in lines:
            lower = line.lower()
            if any(k in lower for k in ["manufactured & packed by", "manufactured and packed by"]):
                role = "Manufactured & Packed By"
                mfg_name = clean_value(re.sub(r'manufactured\s*(?:&|and)\s*packed\s*by[\s.:]*', '', line, flags=re.IGNORECASE))
                confidence = 96.5
                break
            elif "manufactured by" in lower or "mfg by" in lower:
                role = "Manufactured By"
                mfg_name = clean_value(re.sub(r'(?:manufactured|mfg)\s*by[\s.:]*', '', line, flags=re.IGNORECASE))
                confidence = 95.0
                break
            elif "packed by" in lower or "pkd by" in lower:
                role = "Packed By"
                mfg_name = clean_value(re.sub(r'(?:packed|pkd)\s*by[\s.:]*', '', line, flags=re.IGNORECASE))
                confidence = 94.0
                break
            elif "imported by" in lower or "distributed by" in lower:
                role = "Imported / Distributed By"
                mfg_name = clean_value(re.sub(r'(?:imported|distributed)\s*(?:and|&)?\s*(?:by)?[\s.:]*', '', line, flags=re.IGNORECASE))
                confidence = 92.0
                break

        status = "Found" if mfg_name else "Missing"
        return {
            "manufacturer_name": {"value": mfg_name, "confidence": confidence, "status": status},
            "manufacturer_packer_importer": {"value": role if mfg_name else "", "confidence": confidence, "status": status}
        }

    def _extract_address(self, raw_text: str, lines: List[str]) -> Dict[str, Any]:
        # Address keywords: Plot, Road, Industrial Area, Nagar, Street, Sonipat, Pune, Mumbai, Pin, etc.
        for line in lines:
            lower = line.lower()
            if "address" in lower:
                addr = clean_value(re.sub(r'address[\s.:]*', '', line, flags=re.IGNORECASE))
                if "obscured" in addr.lower() or "unreadable" in addr.lower():
                    return {"value": addr, "confidence": 45.0, "status": "Low Confidence"}
                return {"value": addr, "confidence": 95.0, "status": "Found"}

        for line in lines:
            lower = line.lower()
            if any(k in lower for k in ["plot no", "phase-", "industrial area", "sector", "road", "street", "haryana", "maharashtra", "delhi"]):
                if len(line) > 15:
                    return {"value": line.strip(), "confidence": 90.0, "status": "Found"}

        return {"value": "", "confidence": 0.0, "status": "Missing"}

    def _extract_consumer_care(self, raw_text: str, lines: List[str]) -> Dict[str, Any]:
        care_details = []
        
        # Phone / Helpline regex
        phone_match = re.search(r'(?:consumer\s*care|customer\s*care|helpline|toll\s*free|care\s*cell|call)[\s.:]*([0-9]{3,4}[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}|[0-9]{10,11})', raw_text, re.IGNORECASE)
        if phone_match:
            care_details.append(f"Tel: {phone_match.group(1).strip()}")
            
        # Email regex
        email_match = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', raw_text)
        if email_match:
            care_details.append(f"Email: {email_match.group(1).strip()}")

        if care_details:
            return {
                "value": " | ".join(care_details),
                "confidence": 98.0,
                "status": "Found"
            }
        
        # Check lines for customer care mentions
        for line in lines:
            lower = line.lower()
            if any(k in lower for k in ["customer care", "consumer care", "helpline", "customercare@"]):
                return {"value": line.strip(), "confidence": 85.0, "status": "Found"}

        return {"value": "", "confidence": 0.0, "status": "Missing"}

    def _extract_country_of_origin(self, raw_text: str, lines: List[str]) -> Dict[str, Any]:
        match = re.search(r'(?:country\s*of\s*origin|made\s*in|product\s*of)[\s.:]*([a-zA-Z\s]+)', raw_text, re.IGNORECASE)
        if match:
            country = clean_value(match.group(1)).split("\n")[0].strip()
            return {"value": country, "confidence": 98.0, "status": "Found"}
        return {"value": "", "confidence": 0.0, "status": "Missing"}

    def _extract_batch_number(self, raw_text: str, lines: List[str]) -> Dict[str, Any]:
        match = re.search(r'(?:batch\s*(?:no|number)|lot\s*(?:no|number)|b\.no)[\s.:]*([a-zA-Z0-9\-_]+)', raw_text, re.IGNORECASE)
        if match:
            return {"value": clean_value(match.group(1)), "confidence": 96.0, "status": "Found"}
        return {"value": "", "confidence": 0.0, "status": "Missing"}


field_extractor = FieldExtractor()
