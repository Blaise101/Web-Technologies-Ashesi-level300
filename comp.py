# 3)


def calc_kwh(power_watts, hours):
    """Utility function to calculate kWh from Watts and Hours."""
    return (power_watts * hours) / 1000.0

# Operating assumptions
active_hours = 10.0  # Total hours PC runs per day
load_hours = 2.0      # Dedicated to graphical/heavy tasks (gaming, rendering)
HOURS_GPU_IDLE = active_hours - load_hours  # 6.0 hours

# Component Power Ranges (in Watts)
# CPU (Intel Core i5)
CPU_MIN_W, CPU_MAX_W = 73.0, 95.0

# RAM (2 x DDR4 modules)
RAM_MIN_W, RAM_MAX_W = 1.2, 1.6

# Motherboard (Regular)
MB_MIN_W, MB_MAX_W = 25.0, 40.0

# Storage (1 x SSD)
STORAGE_MIN_W, STORAGE_MAX_W = 0.6, 2.8

# GPU (Mid-End Graphics Card)
GPU_IDLE_MIN_W, GPU_IDLE_MAX_W = 8.0, 13.0
GPU_LOAD_MIN_W, GPU_LOAD_MAX_W = 110.0, 164.0


# Activity 3: Daily Energy for Base Components (CPU, RAM, Motherboard, Storage)
cpu_min_kwh = calc_kwh(CPU_MIN_W, active_hours)
cpu_max_kwh = calc_kwh(CPU_MAX_W, active_hours)

ram_min_kwh = calc_kwh(RAM_MIN_W, active_hours)
ram_max_kwh = calc_kwh(RAM_MAX_W, active_hours)

mb_min_kwh = calc_kwh(MB_MIN_W, active_hours)
mb_max_kwh = calc_kwh(MB_MAX_W, active_hours)

storage_min_kwh = calc_kwh(STORAGE_MIN_W, active_hours)
storage_max_kwh = calc_kwh(STORAGE_MAX_W, active_hours)

base_min_kwh = cpu_min_kwh + ram_min_kwh + mb_min_kwh + storage_min_kwh
base_max_kwh = cpu_max_kwh + ram_max_kwh + mb_max_kwh + storage_max_kwh

# Activity 5: GPU Daily Energy (Load vs Idle Mode)
gpu_idle_min_kwh = calc_kwh(GPU_IDLE_MIN_W, active_hours)
gpu_idle_max_kwh = calc_kwh(GPU_IDLE_MAX_W, active_hours)
print(f"GPU Idle Daily kWh: {gpu_idle_min_kwh:.3f} - {gpu_idle_max_kwh:.3f} kWh")

gpu_load_min_kwh = calc_kwh(GPU_LOAD_MIN_W, active_hours)
gpu_load_max_kwh = calc_kwh(GPU_LOAD_MAX_W, active_hours)
print(f"GPU Load Daily kWh: {gpu_load_min_kwh:.3f} - {gpu_load_max_kwh:.3f} kWh")

# Activity 6: Total PC Daily Energy Consumption
# Mode (a): GPU always under Load
total_daily_load_min = base_min_kwh + gpu_load_min_kwh
total_daily_load_max = base_max_kwh + gpu_load_max_kwh
print(f"Total Daily kWh (GPU Load): {total_daily_load_min:.3f} - {total_daily_load_max:.3f} kWh")

# Mode (b): GPU always Idle
total_daily_idle_min = base_min_kwh + gpu_idle_min_kwh
total_daily_idle_max = base_max_kwh + gpu_idle_max_kwh
print(f"Total Daily kWh (GPU Idle): {total_daily_idle_min:.3f} - {total_daily_idle_max:.3f} kWh")

# Activity 7: 2024 ECG/PURC Monthly Billing Calculation (September = 30 Days)
def calculate_ecg_bill_2024(kwh_consumed):
    """Calculates tariff according to Part 2 2024 brackets."""
    if kwh_consumed <= 50:
        return kwh_consumed * 0.34
    elif kwh_consumed <= 300:
        return (50 * 0.34) + ((kwh_consumed - 50) * 0.67)
    elif kwh_consumed <= 600:
        return (50 * 0.34) + (250 * 0.67) + ((kwh_consumed - 300) * 0.87)
    else:
        return (50 * 0.34) + (250 * 0.67) + (300 * 0.87) + ((kwh_consumed - 600) * 0.97)

sept_load_min_kwh = total_daily_load_min * 30
sept_load_max_kwh = total_daily_load_max * 30

sept_idle_min_kwh = total_daily_idle_min * 30
sept_idle_max_kwh = total_daily_idle_max * 30

bill_load_min = calculate_ecg_bill_2024(sept_load_min_kwh)
bill_load_max = calculate_ecg_bill_2024(sept_load_max_kwh)

bill_idle_min = calculate_ecg_bill_2024(sept_idle_min_kwh)
bill_idle_max = calculate_ecg_bill_2024(sept_idle_max_kwh)

# Output Results
print("-- Part 2 Computation Results --")
print(f"Base Components Daily kWh: {base_min_kwh:.3f} - {base_max_kwh:.3f} kWh")
print(f"Total Daily kWh (GPU Load): {total_daily_load_min:.3f} - {total_daily_load_max:.3f} kWh")
print(f"Total Daily kWh (GPU Idle): {total_daily_idle_min:.3f} - {total_daily_idle_max:.3f} kWh")
print("\n--- September (30 days) Projected Electricity Bill (2024 Tariffs) ---")
print(f"Load Mode:  {sept_load_min_kwh:.2f} kWh (GHC {bill_load_min:.2f}) to {sept_load_max_kwh:.2f} kWh (GHC {bill_load_max:.2f})")
print(f"Idle Mode:  {sept_idle_min_kwh:.2f} kWh (GHC {bill_idle_min:.2f}) to {sept_idle_max_kwh:.2f} kWh (GHC {bill_idle_max:.2f})")


# ============================================================
# PART 3.1 - SERVER HARDWARE POWER CONSUMPTION
# ============================================================

def calc_kwh(power_watts, hours):
    """Calculate energy consumption in kWh."""
    return (power_watts * hours) / 1000.0


# Server configuration
server_hours = 24.0

CPU_COUNT = 2
RAM_COUNT = 8
SSD_COUNT = 4

# Intel Xeon Gold power range from the lab
SERVER_CPU_MIN_W = 85.0
SERVER_CPU_MAX_W = 205.0

# DDR4 ECC RDIMM
SERVER_RAM_MIN_W = 1.2
SERVER_RAM_MAX_W = 3.4

# Enterprise SSD (active)
SERVER_SSD_MIN_W = 3.0
SERVER_SSD_MAX_W = 8.0


# Total component power
server_min_w = (
    CPU_COUNT * SERVER_CPU_MIN_W
    + RAM_COUNT * SERVER_RAM_MIN_W
    + SSD_COUNT * SERVER_SSD_MIN_W
)

server_max_w = (
    CPU_COUNT * SERVER_CPU_MAX_W
    + RAM_COUNT * SERVER_RAM_MAX_W
    + SSD_COUNT * SERVER_SSD_MAX_W
)


# Daily energy
server_min_kwh = calc_kwh(server_min_w, server_hours)
server_max_kwh = calc_kwh(server_max_w, server_hours)


print("----- Activity 3.1: Server Energy -----")
print(f"Minimum Server Power: {server_min_w:.2f} W")
print(f"Maximum Server Power: {server_max_w:.2f} W")
print(f"Minimum Daily Energy: {server_min_kwh:.4f} kWh")
print(f"Maximum Daily Energy: {server_max_kwh:.4f} kWh")

# ============================================================
# PART 3.2 - PSU EFFICIENCY
# ============================================================

def ac_input_power(dc_power, efficiency):
    """Calculate AC power drawn from the wall."""
    return dc_power / efficiency


def calculate_psu_monthly_energy(dc_power, efficiency, days=30):
    """Calculate monthly AC energy consumption."""
    ac_power = ac_input_power(dc_power, efficiency)
    return calc_kwh(ac_power, 24 * days)


BRONZE_EFFICIENCY = 0.85
GOLD_EFFICIENCY = 0.88
TITANIUM_EFFICIENCY = 0.94


bronze_energy = calculate_psu_monthly_energy(
    server_max_w, BRONZE_EFFICIENCY
)

gold_energy = calculate_psu_monthly_energy(
    server_max_w, GOLD_EFFICIENCY
)

titanium_energy = calculate_psu_monthly_energy(
    server_max_w, TITANIUM_EFFICIENCY
)


bronze_extra_vs_titanium = bronze_energy - titanium_energy


print("\n----- Activity 3.2: PSU Efficiency -----")
print(f"Bronze Monthly Energy: {bronze_energy:.2f} kWh")
print(f"Gold Monthly Energy: {gold_energy:.2f} kWh")
print(f"Titanium Monthly Energy: {titanium_energy:.2f} kWh")
print(
    f"Extra Bronze Energy vs Titanium: "
    f"{bronze_extra_vs_titanium:.2f} kWh/month"
)

# ============================================================
# PART 3.3 - PUE AND DCIe
# ============================================================

def calculate_pue_metrics(
    number_of_servers,
    power_per_server_w,
    pue
):
    """Calculate IT load, facility power and overhead."""

    it_power_kw = (
        number_of_servers * power_per_server_w
    ) / 1000.0

    facility_power_kw = it_power_kw * pue
    overhead_power_kw = facility_power_kw - it_power_kw

    dcie = (1 / pue) * 100

    return (
        it_power_kw,
        facility_power_kw,
        overhead_power_kw,
        dcie
    )


NUMBER_OF_SERVERS = 10
POWER_PER_SERVER_W = 250

CURRENT_PUE = 1.56
BEST_CASE_PUE = 1.10


current_metrics = calculate_pue_metrics(
    NUMBER_OF_SERVERS,
    POWER_PER_SERVER_W,
    CURRENT_PUE
)

best_case_metrics = calculate_pue_metrics(
    NUMBER_OF_SERVERS,
    POWER_PER_SERVER_W,
    BEST_CASE_PUE
)


it_power, facility_power, overhead, dcie = current_metrics

_, improved_facility_power, improved_overhead, improved_dcie = (
    best_case_metrics
)


monthly_saving_kwh = (
    facility_power - improved_facility_power
) * 24 * 30


print("\n----- Activity 3.3: PUE/DCiE -----")

print(f"IT Load: {it_power:.2f} kW")
print(f"Facility Power (PUE 1.56): {facility_power:.2f} kW")
print(f"Cooling/Overhead: {overhead:.2f} kW")
print(f"DCiE: {dcie:.2f}%")

print("\nAfter PUE Upgrade:")
print(f"Facility Power (PUE 1.10): {improved_facility_power:.2f} kW")
print(f"Cooling/Overhead: {improved_overhead:.2f} kW")
print(f"DCiE: {improved_dcie:.2f}%")
print(f"Monthly Energy Saved: {monthly_saving_kwh:.2f} kWh")


# ============================================================
# PART 3.4 - UTILIZATION PROPORTIONAL POWER
# ============================================================

def utilization_power(p_idle, p_max, utilization):
    """
    Calculate power based on CPU utilization.
    utilization should be between 0 and 1.
    """
    return p_idle + (p_max - p_idle) * utilization


def utilization_energy(p_idle, p_max, utilization_readings):
    """
    Calculate total energy from utilization readings.
    Each reading represents a 5-minute interval.
    """

    interval_hours = 5 / 60
    total_kwh = 0

    for utilization in utilization_readings:
        power = utilization_power(
            p_idle,
            p_max,
            utilization
        )

        total_kwh += calc_kwh(power, interval_hours)

    return total_kwh


# Replace these with the actual Task Manager readings.
cpu_utilization = [
    # 0.20, 0.35, 0.18, ...
]


if cpu_utilization:

    actual_energy = utilization_energy(
        CPU_MIN_W,
        CPU_MAX_W,
        cpu_utilization
    )

    always_max_energy = calc_kwh(
        CPU_MAX_W,
        2
    )

    gap = always_max_energy - actual_energy

    print("\n----- Activity 3.4 -----")
    print(f"Measured-model Energy: {actual_energy:.4f} kWh")
    print(f"Always-Max Energy: {always_max_energy:.4f} kWh")
    print(f"Energy Gap: {gap:.4f} kWh")

else:
    print("\nActivity 3.4 requires the 24 actual CPU utilization readings.")


# ============================================================
# PART 3.5 - CARBON EMISSIONS
# ============================================================

GHANA_EMISSION_FACTOR = 0.145
WORLD_AVERAGE_FACTOR = 0.445
LOW_CARBON_CLOUD_FACTOR = 0.038


def calculate_co2(energy_kwh, emission_factor):
    """Calculate CO2 emissions in kilograms."""
    return energy_kwh * emission_factor


server_min_monthly_kwh = server_min_kwh * 30
server_max_monthly_kwh = server_max_kwh * 30


# Ghana
server_min_co2_daily = calculate_co2(
    server_min_kwh,
    GHANA_EMISSION_FACTOR
)

server_max_co2_daily = calculate_co2(
    server_max_kwh,
    GHANA_EMISSION_FACTOR
)

server_min_co2_monthly = calculate_co2(
    server_min_monthly_kwh,
    GHANA_EMISSION_FACTOR
)

server_max_co2_monthly = calculate_co2(
    server_max_monthly_kwh,
    GHANA_EMISSION_FACTOR
)


# Cloud comparison using maximum server energy
cloud_monthly_co2_low = calculate_co2(
    server_max_monthly_kwh,
    LOW_CARBON_CLOUD_FACTOR
)

cloud_monthly_co2_world = calculate_co2(
    server_max_monthly_kwh,
    WORLD_AVERAGE_FACTOR
)

cloud_co2_saved = (
    cloud_monthly_co2_world
    - cloud_monthly_co2_low
)


print("\n----- Activity 3.5: CO2 -----")
print(
    f"Server Daily CO2: "
    f"{server_min_co2_daily:.2f} - "
    f"{server_max_co2_daily:.2f} kg"
)

print(
    f"Server Monthly CO2: "
    f"{server_min_co2_monthly:.2f} - "
    f"{server_max_co2_monthly:.2f} kg"
)

print(
    f"CO2 at 38 g/kWh: "
    f"{cloud_monthly_co2_low:.2f} kg/month"
)

print(
    f"CO2 at 445 g/kWh: "
    f"{cloud_monthly_co2_world:.2f} kg/month"
)

print(
    f"CO2 Saved: "
    f"{cloud_co2_saved:.2f} kg/month"
)


# ============================================================
# PART 3.6 - SOLAR PANEL AREA
# ============================================================

def solar_area_needed(
    daily_kwh,
    irradiance,
    efficiency
):
    """Calculate required solar panel area in square metres."""
    return daily_kwh / (irradiance * efficiency)


SOLAR_IRRADIANCE = 5.5
PANEL_EFFICIENCY = 0.18


pc_max_daily_kwh = total_daily_load_max

pc_solar_area = solar_area_needed(
    pc_max_daily_kwh,
    SOLAR_IRRADIANCE,
    PANEL_EFFICIENCY
)

server_min_solar_area = solar_area_needed(
    server_min_kwh,
    SOLAR_IRRADIANCE,
    PANEL_EFFICIENCY
)

server_max_solar_area = solar_area_needed(
    server_max_kwh,
    SOLAR_IRRADIANCE,
    PANEL_EFFICIENCY
)


print("\n----- Activity 3.6: Solar -----")
print(f"PC Solar Area: {pc_solar_area:.2f} m²")
print(
    f"Server Solar Area: "
    f"{server_min_solar_area:.2f} - "
    f"{server_max_solar_area:.2f} m²"
)

# ============================================================
# PART 3.7 - UPS / BATTERY SIZING
# ============================================================

def required_battery_capacity(
    load_w,
    runtime_hours,
    battery_voltage,
    efficiency,
    depth_of_discharge,
    aging_factor=1.0
):
    """
    Calculate required battery capacity in Ah.
    aging_factor can be used to account for degradation.
    """

    capacity = (
        load_w * runtime_hours
    ) / (
        battery_voltage
        * efficiency
        * depth_of_discharge
    )

    return capacity / aging_factor


ROUTER_W = 10
MODEM_W = 8
LAPTOP_CHARGER_W = 65

TOTAL_LOAD_W = (
    ROUTER_W
    + MODEM_W
    + LAPTOP_CHARGER_W
)

RUNTIME_HOURS = 3
BATTERY_VOLTAGE = 12
INVERTER_EFFICIENCY = 0.85
DEPTH_OF_DISCHARGE = 0.50

# 80% remaining effective capacity
AGING_FACTOR = 0.80


battery_capacity = required_battery_capacity(
    TOTAL_LOAD_W,
    RUNTIME_HOURS,
    BATTERY_VOLTAGE,
    INVERTER_EFFICIENCY,
    DEPTH_OF_DISCHARGE
)

adjusted_capacity = required_battery_capacity(
    TOTAL_LOAD_W,
    RUNTIME_HOURS,
    BATTERY_VOLTAGE,
    INVERTER_EFFICIENCY,
    DEPTH_OF_DISCHARGE,
    AGING_FACTOR
)


print("\n----- Activity 3.7: UPS -----")
print(f"Total Load: {TOTAL_LOAD_W} W")
print(f"Required Battery Capacity: {battery_capacity:.2f} Ah")
print(f"Adjusted Capacity: {adjusted_capacity:.2f} Ah")

def calculate_ecg_bill_current(kwh_consumed):
    """
    Current PURC/ECG tariff calculation.

    Rates must be updated with the tariff
    retrieved on the submission date.
    """

    # We will insert the current tariff brackets here.
    pass


# ============================================================
# PART 3.9 - EMPIRICAL VALIDATION
# ============================================================

def compare_measurement(
    measured_w,
    estimated_min_w,
    estimated_max_w
):
    """Compare measured power against estimated range."""

    if measured_w < estimated_min_w:
        position = "Below estimated range"
    elif measured_w > estimated_max_w:
        position = "Above estimated range"
    else:
        position = "Within estimated range"

    return position


# Enter actual measurements when available
measured_idle_w = None
measured_load_w = None

if measured_idle_w is not None:
    print(
        "Idle:",
        compare_measurement(
            measured_idle_w,
            GPU_IDLE_MIN_W,
            GPU_IDLE_MAX_W
        )
    )

if measured_load_w is not None:
    print(
        "Load:",
        compare_measurement(
            measured_load_w,
            GPU_LOAD_MIN_W,
            GPU_LOAD_MAX_W
        )
    )