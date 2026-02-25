"use client";

// Machine Profile Panel
// Always visible, editable, changes trigger instant revalidation

import { useAppStore, selectMachineProfile } from "@/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MachineProfile, Unit } from "@/lib/types/machine";
import { useCallback } from "react";

function AxisField({
    axis,
    label,
    profile,
    onChange,
}: {
    axis: "x" | "y" | "z";
    label: string;
    profile: MachineProfile;
    onChange: (profile: Partial<MachineProfile>) => void;
}) {
    const limits = profile.axes[axis];
    const step = profile.units === "mm" ? 1 : 0.01;

    const updateLimits = (nextMin: number, nextMax: number) => {
        onChange({
            axes: {
                ...profile.axes,
                [axis]: { ...limits, min: nextMin, max: nextMax },
            },
        });
    };

    const setMin = (value: number) => updateLimits(value, limits.max);
    const setMax = (value: number) => updateLimits(limits.min, value);

    return (
        <div className="rounded-sm border border-border-500 bg-bg-800 p-2">
            <div className="mb-2 flex items-center justify-between border-b border-border-500 pb-1.5">
                <Label className="font-code text-xs uppercase tracking-wider text-text-200">{label} Axis</Label>
                <span className="font-code text-[11px] uppercase tracking-wider text-text-300">{profile.units}</span>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <span className="w-9 text-[11px] font-code uppercase tracking-wide text-text-300">Min</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMin(limits.min - step)}
                        className="h-6 w-6 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                    >
                        -
                    </Button>
                    <Input
                        type="number"
                        value={limits.min}
                        step={step}
                        onChange={(e) => setMin(parseFloat(e.target.value) || 0)}
                        className="no-spinner h-6 flex-1 bg-bg-900 px-1.5 text-right font-code text-xs text-text-100"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMin(limits.min + step)}
                        className="h-6 w-6 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                    >
                        +
                    </Button>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="w-9 text-[11px] font-code uppercase tracking-wide text-text-300">Max</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMax(limits.max - step)}
                        className="h-6 w-6 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                    >
                        -
                    </Button>
                    <Input
                        type="number"
                        value={limits.max}
                        step={step}
                        onChange={(e) => setMax(parseFloat(e.target.value) || 0)}
                        className="no-spinner h-6 flex-1 bg-bg-900 px-1.5 text-right font-code text-xs text-text-100"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMax(limits.max + step)}
                        className="h-6 w-6 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                    >
                        +
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function MachineProfilePanel() {
    const profile = useAppStore(selectMachineProfile);
    const updateProfile = useAppStore((s) => s.updateMachineProfile);
    const setProfile = useAppStore((s) => s.setMachineProfile);
    const feedStep = profile.units === "mm" ? 10 : 0.1;
    const spindleStep = 100;

    const handleAxisChange = useCallback(
        (updates: Partial<MachineProfile>) => {
            if (updates.axes) {
                setProfile({ ...profile, axes: updates.axes });
            }
        },
        [profile, setProfile]
    );

    return (
        <div className="flex h-full min-h-0 flex-col" id="machine-profile-panel">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-500 bg-bg-800">
                <span className="text-xs font-ui text-text-200 uppercase tracking-wider">
                    Machine Profile
                </span>
                <span className="text-xs font-code text-text-300">{profile.name}</span>
            </div>

            {/* Content */}
            <ScrollArea className="min-h-0 flex-1">
                <div className="p-3 space-y-3">
                    {/* Profile name */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1 block">Name</Label>
                        <Input
                            value={profile.name}
                            onChange={(e) => updateProfile({ name: e.target.value })}
                            className="h-7 text-xs font-code bg-bg-900 border-border-500 text-text-100"
                        />
                    </div>

                    {/* Units */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1 block">Units</Label>
                        <Select
                            value={profile.units}
                            onValueChange={(v) => updateProfile({ units: v as Unit })}
                        >
                            <SelectTrigger className="h-7 text-xs font-code bg-bg-900 border-border-500 text-text-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-bg-800 border-border-500">
                                <SelectItem value="mm" className="text-xs font-code text-text-100">
                                    Millimeters (mm)
                                </SelectItem>
                                <SelectItem value="inch" className="text-xs font-code text-text-100">
                                    Inches (in)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Axis limits */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1.5 block">Axis Limits</Label>
                        <div className="space-y-2">
                            <AxisField axis="x" label="X" profile={profile} onChange={handleAxisChange} />
                            <AxisField axis="y" label="Y" profile={profile} onChange={handleAxisChange} />
                            <AxisField axis="z" label="Z" profile={profile} onChange={handleAxisChange} />
                        </div>
                    </div>

                    {/* Max feed rate */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1 block">
                            Max Feed Rate ({profile.units}/min)
                        </Label>
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateProfile({ maxFeedRate: profile.maxFeedRate - feedStep })}
                                className="h-7 w-7 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                            >
                                -
                            </Button>
                            <Input
                                type="number"
                                value={profile.maxFeedRate}
                                step={feedStep}
                                onChange={(e) => updateProfile({ maxFeedRate: parseFloat(e.target.value) || 0 })}
                                className="no-spinner h-7 text-xs font-code bg-bg-900 border-border-500 text-text-100 text-right"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateProfile({ maxFeedRate: profile.maxFeedRate + feedStep })}
                                className="h-7 w-7 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    {/* Max spindle speed */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1 block">Max Spindle Speed (RPM)</Label>
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateProfile({ maxSpindleSpeed: profile.maxSpindleSpeed - spindleStep })}
                                className="h-7 w-7 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                            >
                                -
                            </Button>
                            <Input
                                type="number"
                                value={profile.maxSpindleSpeed}
                                step={spindleStep}
                                onChange={(e) => updateProfile({ maxSpindleSpeed: parseFloat(e.target.value) || 0 })}
                                className="no-spinner h-7 text-xs font-code bg-bg-900 border-border-500 text-text-100 text-right"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateProfile({ maxSpindleSpeed: profile.maxSpindleSpeed + spindleStep })}
                                className="h-7 w-7 border-border-500 bg-bg-900 p-0 font-code text-xs text-text-200 hover:bg-bg-700"
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    {/* Supported G-codes */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1 block">
                            Supported G-codes ({profile.supportedGCodes.length})
                        </Label>
                        <div className="flex flex-wrap gap-1">
                            {profile.supportedGCodes.map((code) => (
                                <span
                                    key={code}
                                    className="px-1.5 py-0.5 text-xs font-code bg-bg-900 border border-border-500 text-semantic-motion rounded-sm"
                                >
                                    {code}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Supported M-codes */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1 block">
                            Supported M-codes ({profile.supportedMCodes.length})
                        </Label>
                        <div className="flex flex-wrap gap-1">
                            {profile.supportedMCodes.map((code) => (
                                <span
                                    key={code}
                                    className="px-1.5 py-0.5 text-xs font-code bg-bg-900 border border-border-500 text-semantic-error rounded-sm"
                                >
                                    {code}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
