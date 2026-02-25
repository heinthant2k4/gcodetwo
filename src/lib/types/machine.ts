// Machine Profile Type Definitions
// Defines the hard constraints for G-code validation and simulation

export type Unit = "mm" | "inch";

export interface AxisLimits {
    min: number;
    max: number;
}

export interface MachineProfile {
    name: string;
    units: Unit;
    axes: {
        x: AxisLimits;
        y: AxisLimits;
        z: AxisLimits;
    };
    maxFeedRate: number; // units/min
    maxSpindleSpeed: number; // RPM
    supportedGCodes: string[];
    supportedMCodes: string[];
}
