"use client";

// Machine Profile Panel
// Always visible, editable, changes trigger instant revalidation

import { useAppStore, selectMachineProfile } from "@/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

    return (
        <div className="flex items-center gap-2">
            <Label className="text-xs text-text-300 w-6 font-code uppercase">{label}</Label>
            <div className="flex items-center gap-1 flex-1">
                <Input
                    type="number"
                    value={limits.min}
                    onChange={(e) =>
                        onChange({
                            axes: {
                                ...profile.axes,
                                [axis]: { ...limits, min: parseFloat(e.target.value) || 0 },
                            },
                        })
                    }
                    className="h-6 text-xs font-code bg-bg-900 border-border-500 text-text-100 w-16 px-1.5 text-right"
                />
                <span className="text-text-300 text-xs">→</span>
                <Input
                    type="number"
                    value={limits.max}
                    onChange={(e) =>
                        onChange({
                            axes: {
                                ...profile.axes,
                                [axis]: { ...limits, max: parseFloat(e.target.value) || 0 },
                            },
                        })
                    }
                    className="h-6 text-xs font-code bg-bg-900 border-border-500 text-text-100 w-16 px-1.5 text-right"
                />
                <span className="text-xs text-text-300 font-code">{profile.units}</span>
            </div>
        </div>
    );
}

export default function MachineProfilePanel() {
    const profile = useAppStore(selectMachineProfile);
    const updateProfile = useAppStore((s) => s.updateMachineProfile);
    const setProfile = useAppStore((s) => s.setMachineProfile);

    const handleAxisChange = useCallback(
        (updates: Partial<MachineProfile>) => {
            if (updates.axes) {
                setProfile({ ...profile, axes: updates.axes });
            }
        },
        [profile, setProfile]
    );

    return (
        <div className="flex flex-col h-full" id="machine-profile-panel">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-500 bg-bg-800">
                <span className="text-xs font-ui text-text-200 uppercase tracking-wider">
                    Machine Profile
                </span>
                <span className="text-xs font-code text-text-300">{profile.name}</span>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
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
                        <div className="space-y-1.5">
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
                        <Input
                            type="number"
                            value={profile.maxFeedRate}
                            onChange={(e) => updateProfile({ maxFeedRate: parseFloat(e.target.value) || 0 })}
                            className="h-7 text-xs font-code bg-bg-900 border-border-500 text-text-100"
                        />
                    </div>

                    {/* Max spindle speed */}
                    <div>
                        <Label className="text-xs text-text-300 mb-1 block">Max Spindle Speed (RPM)</Label>
                        <Input
                            type="number"
                            value={profile.maxSpindleSpeed}
                            onChange={(e) => updateProfile({ maxSpindleSpeed: parseFloat(e.target.value) || 0 })}
                            className="h-7 text-xs font-code bg-bg-900 border-border-500 text-text-100"
                        />
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
