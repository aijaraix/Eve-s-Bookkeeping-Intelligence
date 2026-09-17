from app import remap_result_to_original, normalize_rotation_degrees


def close(a, b, eps=1e-9):
    assert abs(float(a) - float(b)) <= eps, (a, b)


base = {
    "engine": "paddleocr",
    "pages": [{
        "pageNumber": 1,
        "width": 1000,
        "height": 900,
        "regions": [{
            "regionId": "p1-r1",
            "text": "TOTAL $53.23",
            "confidence": 0.99,
            "boundingBox": {"x": 0.2, "y": 0.1, "width": 0.3, "height": 0.2, "unit": "NORMALIZED"},
            "polygon": [[0.2, 0.1], [0.5, 0.1], [0.5, 0.3], [0.2, 0.3]],
        }],
    }],
    "warnings": [],
}

mapped90 = remap_result_to_original(base, 90, 900, 1000)
page = mapped90["pages"][0]
box = page["regions"][0]["boundingBox"]
assert page["width"] == 900 and page["height"] == 1000
assert page["workingImageWidth"] == 1000 and page["workingImageHeight"] == 900
close(box["x"], 0.7); close(box["y"], 0.2); close(box["width"], 0.2); close(box["height"], 0.3)
assert mapped90["appliedRotationDegrees"] == 90
assert mapped90["coordinateSpace"] == "ORIGINAL_SOURCE"
assert "OCR_COORDINATES_REMAPPED_TO_ORIGINAL_SOURCE" in mapped90["warnings"]

mapped180 = remap_result_to_original(base, 180, 900, 1000)
box180 = mapped180["pages"][0]["regions"][0]["boundingBox"]
close(box180["x"], 0.5); close(box180["y"], 0.7); close(box180["width"], 0.3); close(box180["height"], 0.2)

mapped270 = remap_result_to_original(base, 270, 900, 1000)
box270 = mapped270["pages"][0]["regions"][0]["boundingBox"]
close(box270["x"], 0.1); close(box270["y"], 0.5); close(box270["width"], 0.2); close(box270["height"], 0.3)

try:
    normalize_rotation_degrees(45)
    raise AssertionError("45 degrees should fail closed")
except Exception as exc:
    assert "OCR_ROTATION_UNSUPPORTED" in str(exc)

print("OCR_ORIENTATION_GEOMETRY_TESTS=PASS")
