import { ZAMBIAN_PROVINCES, ZAMBIA_LOCATIONS } from "../data/mockData";

export default function LocationSelect({
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  allowEmpty = false,
  required = false,
  inputStyle,
  stacked = false,
}) {
  const districts = ZAMBIA_LOCATIONS[province] || [];

  function handleProvinceChange(e) {
    const nextProvince = e.target.value;
    onProvinceChange(nextProvince);
    onDistrictChange("");
  }

  return (
    // `stacked` is for narrow containers (the 260px filter sidebar), where two
    // side-by-side selects can't fit; forms with room to spare keep them in a row.
    // min-w-0 lets a <select> shrink below its widest option instead of
    // overflowing its parent.
    <div className={`flex gap-2.5 ${stacked ? "flex-col" : ""}`}>
      <select
        value={province}
        onChange={handleProvinceChange}
        required={required}
        className="flex-1 min-w-0 w-full h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none bg-white"
        style={inputStyle}
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
        className={`flex-1 min-w-0 w-full h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none bg-white ${
          province ? "opacity-100 cursor-pointer" : "opacity-60 cursor-not-allowed"
        }`}
        style={inputStyle}
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
