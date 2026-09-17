import { ZAMBIAN_PROVINCES, ZAMBIA_LOCATIONS } from "../data/mockData";

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
    onDistrictChange("");
  }

  return (
    <div className="flex gap-2.5">
      <select
        value={province}
        onChange={handleProvinceChange}
        required={required}
        className="flex-1 h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none bg-white"
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
        className={`flex-1 h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none bg-white ${
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
