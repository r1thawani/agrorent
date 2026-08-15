import { ZAMBIAN_PROVINCES, ZAMBIA_LOCATIONS } from "../data/mockData";

// Two dependent dropdowns for picking a Zambian location: province first,
// then district. The district list is derived from whichever province is
// currently selected, so it's always a subset of that province's real
// districts — there's no way to end up with a mismatched pair like
// "Southern Province" + "Kitwe". Whenever the province changes, the district
// is reset, since a district chosen under the old province may not exist
// (or may mean something different) under the new one.
//
// `allowEmpty` switches the placeholder copy for use as a filter ("All
// provinces" / "All districts") rather than a required form field ("Select
// province…" / "Select district…").
export default function LocationSelect({
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  allowEmpty = false,
  required = false,
  inputStyle,
}) {
  const districts = ZAMBIA_LOCATIONS[province] || [];

  function handleProvinceChange(e) {
    const nextProvince = e.target.value;
    onProvinceChange(nextProvince);
    onDistrictChange(""); // previous district may not exist in the new province
  }

  const baseStyle = {
    width: "100%",
    height: "44px",
    padding: "0 12px",
    fontSize: "13px",
    border: "1.5px solid #E0E8E3",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    ...inputStyle,
  };

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <select
        value={province}
        onChange={handleProvinceChange}
        required={required}
        style={{ ...baseStyle, flex: 1 }}
      >
        <option value="">{allowEmpty ? "All provinces" : "Select province…"}</option>
        {ZAMBIAN_PROVINCES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={district}
        onChange={(e) => onDistrictChange(e.target.value)}
        disabled={!province}
        required={required}
        style={{ ...baseStyle, flex: 1, opacity: province ? 1 : 0.6, cursor: province ? "pointer" : "not-allowed" }}
      >
        <option value="">
          {!province ? "Select province first" : allowEmpty ? "All districts" : "Select district…"}
        </option>
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}
