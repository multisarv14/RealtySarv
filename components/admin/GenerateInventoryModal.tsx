
import React from 'react';
import { Project, InventoryUnit, ParkingSlot } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { confirmDialog } from '../ui/Confirm';

interface GenerateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onGenerate: (updatedProject: Project) => void;
  initialWing?: string | null;
}

interface UnitConfig {
    id: string;
    typeName: string;
    carpetArea: string;
    saleableArea: string;
    price: string;
    count: string;
    bedrooms: string;
    bathrooms: string;
}

const GenerateInventoryModal: React.FC<GenerateInventoryModalProps> = ({ isOpen, onClose, project, onGenerate, initialWing }) => {
    const [selectedWing, setSelectedWing] = React.useState<string>('');
    const [fromFloor, setFromFloor] = React.useState('1');
    const [toFloor, setToFloor] = React.useState(project.totalFloors.toString());
    const [unitNumberSuffixStart, setUnitNumberSuffixStart] = React.useState('01');
    const [unitConfigs, setUnitConfigs] = React.useState<UnitConfig[]>([
        { id: uuidv4(), typeName: '2BHK', carpetArea: '800', saleableArea: '1200', price: '5000000', count: '4', bedrooms: '2', bathrooms: '2' }
    ]);
    const [error, setError] = React.useState<string | null>(null);

    const hasWings = project.wings && project.wings.length > 0;
    const safeInventory = React.useMemo(() => project.inventory || [], [project.inventory]);

    React.useEffect(() => {
        if (isOpen) {
            if (initialWing && hasWings) {
                // EDIT MODE: Reverse engineer config from existing inventory
                setSelectedWing(initialWing);
                
                const wingUnits = safeInventory.filter(u => u.wing === initialWing);
                
                if (wingUnits.length > 0) {
                    const floors = wingUnits.map(u => u.floor);
                    const minFloor = Math.min(...floors);
                    const maxFloor = Math.max(...floors);
                    
                    setFromFloor(minFloor.toString());
                    setToFloor(maxFloor.toString());
                    
                    // Infer unit configs from the lowest floor of this wing
                    const sampleFloor = minFloor;
                    const sampleUnits = wingUnits.filter(u => u.floor === sampleFloor);
                    
                    // Group by unique characteristics to rebuild UnitConfig rows
                    const groups: Record<string, UnitConfig> = {};
                    
                    sampleUnits.forEach(unit => {
                        // Key based on properties that define a "Configuration"
                        // Use strict fallbacks to avoid 'undefined' in key
                        const type = unit.type || 'Unknown';
                        const area = unit.area || 0;
                        const price = unit.price || 0;
                        
                        const key = `${type}-${area}-${price}`;
                        
                        if (!groups[key]) {
                            groups[key] = {
                                id: uuidv4(),
                                typeName: type,
                                saleableArea: area.toString(),
                                carpetArea: (unit.carpetArea || 0).toString(),
                                price: price.toString(),
                                count: '0',
                                bedrooms: (unit.bedrooms || 0).toString(),
                                bathrooms: (unit.bathrooms || 0).toString(),
                            };
                        }
                        // Increment count safely
                        const currentCount = parseInt(groups[key].count || '0', 10);
                        groups[key].count = (currentCount + 1).toString();
                    });
                    
                    if (Object.keys(groups).length > 0) {
                        setUnitConfigs(Object.values(groups));
                    } else {
                        // Fallback if sample floor was empty
                         setUnitConfigs([{ id: uuidv4(), typeName: '2BHK', carpetArea: '800', saleableArea: '1200', price: '5000000', count: '4', bedrooms: '2', bathrooms: '2' }]);
                    }
                } else {
                     // Wing exists in project definition but has no inventory yet
                     setFromFloor('1');
                     setToFloor(project.totalFloors.toString());
                     setUnitConfigs([{ id: uuidv4(), typeName: '2BHK', carpetArea: '800', saleableArea: '1200', price: '5000000', count: '4', bedrooms: '2', bathrooms: '2' }]);
                }

            } else {
                // CREATE MODE: Default values
                setSelectedWing(hasWings ? project.wings![0] : 'All');
                setFromFloor('1');
                setToFloor(project.totalFloors.toString());
                setUnitNumberSuffixStart('01');
                setUnitConfigs([
                    { id: uuidv4(), typeName: '2BHK', carpetArea: '800', saleableArea: '1200', price: '5000000', count: '4', bedrooms: '2', bathrooms: '2' }
                ]);
            }
            setError(null);
        }
    }, [isOpen, project, hasWings, initialWing, safeInventory]);


    const totalUnitsPerFloorPerWing = React.useMemo(() => 
        unitConfigs.reduce((sum, config) => sum + (parseInt(config.count, 10) || 0), 0),
    [unitConfigs]);
    
    const totalUnitsToGenerate = React.useMemo(() => {
        const from = parseInt(fromFloor, 10) || 0;
        const to = parseInt(toFloor, 10) || 0;
        if (from > to) return 0;
        const numFloors = to - from + 1;
        
        const numWings = (selectedWing === 'All' && hasWings) ? project.wings!.length : 1;
        
        return numFloors * numWings * totalUnitsPerFloorPerWing;
    }, [fromFloor, toFloor, totalUnitsPerFloorPerWing, project.wings, selectedWing, hasWings]);

    const handleConfigChange = (id: string, field: keyof UnitConfig, value: string) => {
        setUnitConfigs(prev => prev.map(config => config.id === id ? { ...config, [field]: value } : config));
    };
    
    const addUnitConfig = () => {
        setUnitConfigs(prev => [...prev, { id: uuidv4(), typeName: '', carpetArea: '', saleableArea: '', price: '', count: '0', bedrooms: '', bathrooms: '' }]);
    };
    
    const removeUnitConfig = (id: string) => {
        if (unitConfigs.length > 1) {
            setUnitConfigs(prev => prev.filter(config => config.id !== id));
        } else {
            setError("At least one unit type configuration is required.");
        }
    };
    
    const moveConfig = (id: string, direction: 'up' | 'down') => {
        const index = unitConfigs.findIndex(c => c.id === id);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            const newConfigs = [...unitConfigs];
            [newConfigs[index - 1], newConfigs[index]] = [newConfigs[index], newConfigs[index - 1]];
            setUnitConfigs(newConfigs);
        } else if (direction === 'down' && index < unitConfigs.length - 1) {
            const newConfigs = [...unitConfigs];
            [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];
            setUnitConfigs(newConfigs);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Manual Validation
        if (!fromFloor || !toFloor || !unitNumberSuffixStart) {
            setError("Please fill in all Floor Range fields.");
            return;
        }

        const from = parseInt(fromFloor, 10);
        const to = parseInt(toFloor, 10);
        const startSuffix = parseInt(unitNumberSuffixStart, 10);

        if (isNaN(from) || isNaN(to)) {
             setError("Floors must be valid numbers.");
             return;
        }

        if (from > to) {
            setError("Invalid floor range. 'From' floor cannot be greater than 'To' floor.");
            return;
        }

        if (isNaN(startSuffix)) {
            setError("'Unit Number Suffix Starts From' must be a valid number.");
            return;
        }

        // Validate Configs
        for (const config of unitConfigs) {
            if (!config.typeName.trim()) {
                setError("Unit Type Name is required for all configurations.");
                return;
            }
            const count = parseFloat(config.count);
            const price = parseFloat(config.price);
            const area = parseFloat(config.saleableArea);

            if (isNaN(count) || count < 0) {
                setError(`Invalid count for ${config.typeName || 'unit'}. Must be 0 or more.`);
                return;
            }
            if (isNaN(price) || price < 0) {
                setError(`Invalid price for ${config.typeName || 'unit'}.`);
                return;
            }
            if (isNaN(area) || area <= 0) {
                setError(`Invalid saleable area for ${config.typeName || 'unit'}.`);
                return;
            }
        }
        
        // Calculate target wings
        const effectiveWing = initialWing || selectedWing; // Prioritize initialWing in edit mode
        let targetWings: string[] = [];
        
        if (hasWings) {
            if (effectiveWing === 'All') {
                targetWings = project.wings || [];
            } else {
                targetWings = [effectiveWing];
            }
        } else {
            // No wings project, treat as single unnamed wing
            targetWings = ['']; 
        }

        if (targetWings.length === 0 && hasWings) {
             setError("No wing selected or project has no wings.");
             return;
        }

        // Check if overwriting
        const existingUnitsInRange = safeInventory.some(unit => {
            const inFloorRange = unit.floor >= from && unit.floor <= to;
            const unitWing = unit.wing || '';
            const inWing = targetWings.includes(unitWing);
            // Special case for no-wings project
            const noWingsMatch = !hasWings && inFloorRange;
            
            return inFloorRange && (inWing || noWingsMatch);
        });

        if (existingUnitsInRange) {
            const wingMsg = effectiveWing === 'All' ? 'all wings' : (effectiveWing ? `Wing ${effectiveWing}` : 'the project');
            if (!(await confirmDialog({ title: 'Overwrite existing units?', message: `This will overwrite existing units in ${wingMsg} for floors ${from}-${to}. Booking data for these units might be lost.`, confirmLabel: 'Overwrite', danger: true }))) {
                return;
            }
        }
        
        const newInventoryUnits: InventoryUnit[] = [];
        const newParkingSlots: ParkingSlot[] = [];

        for (let floor = from; floor <= to; floor++) {
            for (const wing of targetWings) {
                let unitIndexOnFloorForWing = 0;
                for (const config of unitConfigs) {
                    const numUnits = parseInt(config.count, 10);
                    for (let i = 0; i < numUnits; i++) {
                        const suffix = (startSuffix + unitIndexOnFloorForWing).toString().padStart(unitNumberSuffixStart.length, '0');
                        // Only add wing prefix if there are wings and the wing name isn't empty
                        const unitNumber = (wing && hasWings) ? `${wing.toUpperCase()}-${floor}${suffix}` : `${floor}${suffix}`;
                        
                        const newUnit: InventoryUnit = {
                            id: uuidv4(),
                            unitNumber: unitNumber,
                            floor: floor,
                            wing: (wing && hasWings) ? wing : undefined,
                            type: config.typeName,
                            area: parseFloat(config.saleableArea),
                            carpetArea: parseFloat(config.carpetArea) || undefined,
                            price: parseFloat(config.price),
                            status: 'Available',
                            bedrooms: config.bedrooms ? parseInt(config.bedrooms, 10) : undefined,
                            bathrooms: config.bathrooms ? parseInt(config.bathrooms, 10) : undefined,
                        };
                        newInventoryUnits.push(newUnit);

                        newParkingSlots.push({
                            id: uuidv4(),
                            slotNumber: `P-${unitNumber}`,
                            level: `B${Math.ceil(Math.abs(floor) / 5) || 1}`,
                            status: 'Available',
                        });
                        unitIndexOnFloorForWing++;
                    }
                }
            }
        }

        // Keep units that are NOT in the target range+wing
        const inventoryToKeep = safeInventory.filter(unit => {
            const inFloorRange = unit.floor >= from && unit.floor <= to;
            const unitWing = unit.wing || '';
            
            const inTargetWings = targetWings.includes(unitWing);
            
            // If unit is in the floor range AND in one of the target wings, drop it
            if (inFloorRange && inTargetWings) {
                return false; 
            }
            return true;
        });

        // Identify removed unit IDs/Numbers to cleanup parking
        // We rely on recreating parking to keep it simple and synced
        // But we must preserve parking for units we kept
        const preservedUnitNumbers = new Set(inventoryToKeep.map(u => u.unitNumber));
        
        const safeParkingInventory = project.parkingInventory || [];
        const parkingToKeep = safeParkingInventory.filter(slot => {
            // Heuristic: P-UnitNumber. If suffix matches a preserved unit, keep it.
            const derivedUnitNum = slot.slotNumber.replace(/^P-/, '');
            return preservedUnitNumbers.has(derivedUnitNum);
        });

        onGenerate({
            ...project,
            inventory: [...inventoryToKeep, ...newInventoryUnits].sort((a,b) => b.floor - a.floor || a.unitNumber.localeCompare(b.unitNumber)),
            parkingInventory: [...parkingToKeep, ...newParkingSlots]
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[var(--medium-bg)] p-6 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-[var(--text-primary)]">
                    {initialWing ? `Edit Inventory Plan: Wing ${initialWing}` : 'Generate Floor Inventory'}
                </h3>
                
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden" noValidate>
                    <div className="overflow-y-auto pr-2 space-y-6">
                        {/* Floor Range */}
                        <fieldset className="border border-[var(--light-bg)] p-4 rounded-md">
                            <legend className="px-2 font-semibold text-[var(--text-primary)]">Scope & Numbering</legend>
                            
                            {/* Wing Selection Dropdown */}
                            {hasWings && (
                                <div className="mb-4">
                                    <label htmlFor="wingSelect" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Select Wing</label>
                                    <select 
                                        id="wingSelect" 
                                        value={selectedWing} 
                                        onChange={(e) => setSelectedWing(e.target.value)} 
                                        disabled={!!initialWing} // Lock wing selection in edit mode
                                        className={`w-full md:w-1/3 p-2 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] ${initialWing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {!initialWing && <option value="All">Apply to All Wings (Identical Plan)</option>}
                                        {project.wings!.map(wing => (
                                            <option key={wing} value={wing}>Wing {wing}</option>
                                        ))}
                                    </select>
                                    {!initialWing && (
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                                            Select a specific wing to customize its floor plan independently.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                <div>
                                    <label htmlFor="fromFloor" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">From Floor</label>
                                    <input type="number" id="fromFloor" value={fromFloor} onChange={e => setFromFloor(e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" />
                                </div>
                                <div>
                                    <label htmlFor="toFloor" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">To Floor</label>
                                    <input type="number" id="toFloor" value={toFloor} onChange={e => setToFloor(e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" />
                                </div>
                                <div>
                                    <label htmlFor="unitNumberSuffixStart" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Unit No. Suffix Start</label>
                                    <input type="text" id="unitNumberSuffixStart" value={unitNumberSuffixStart} onChange={e => setUnitNumberSuffixStart(e.target.value)} placeholder="e.g., 01" className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Units to Generate</label>
                                    <div className="w-full p-2 rounded-md border border-transparent bg-[var(--dark-bg)] text-[var(--text-primary)] font-bold text-lg h-[42px] flex items-center">
                                        {totalUnitsToGenerate.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Unit Configuration */}
                        <fieldset className="border border-[var(--light-bg)] p-4 rounded-md">
                            <legend className="px-2 font-semibold text-[var(--text-primary)]">
                                Unit Configuration {hasWings && selectedWing !== 'All' ? `for Wing ${selectedWing}` : ''} (Per Floor)
                            </legend>
                            <div className="space-y-4 mt-2">
                                {unitConfigs.map((config, index) => (
                                    <div key={config.id} className="flex items-center gap-2">
                                        <div className="flex flex-col items-center justify-center bg-[var(--dark-bg)] p-2 rounded-md self-stretch">
                                            <span className="text-sm text-[var(--text-secondary)] font-bold">{index + 1}</span>
                                            <button type="button" onClick={() => moveConfig(config.id, 'up')} disabled={index === 0} className="p-1 text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--light-bg)]"><i className="fas fa-chevron-up"></i></button>
                                            <button type="button" onClick={() => moveConfig(config.id, 'down')} disabled={index === unitConfigs.length - 1} className="p-1 text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--light-bg)]"><i className="fas fa-chevron-down"></i></button>
                                        </div>
                                        <div className="flex-1 p-3 bg-[var(--dark-bg)] rounded-md border border-transparent relative">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
                                                <div className="col-span-1 sm:col-span-1">
                                                    <label className="block text-xs text-gray-400 mb-1">Type Name*</label>
                                                    <input type="text" value={config.typeName} onChange={e => handleConfigChange(config.id, 'typeName', e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Carpet Area</label>
                                                    <input type="number" value={config.carpetArea} onChange={e => handleConfigChange(config.id, 'carpetArea', e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Saleable Area*</label>
                                                    <input type="number" value={config.saleableArea} onChange={e => handleConfigChange(config.id, 'saleableArea', e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Base Price*</label>
                                                    <input type="number" value={config.price} onChange={e => handleConfigChange(config.id, 'price', e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Bedrooms</label>
                                                    <input type="number" value={config.bedrooms} onChange={e => handleConfigChange(config.id, 'bedrooms', e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Bathrooms</label>
                                                    <input type="number" value={config.bathrooms} onChange={e => handleConfigChange(config.id, 'bathrooms', e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Count*</label>
                                                    <input type="number" value={config.count} onChange={e => handleConfigChange(config.id, 'count', e.target.value)} className="w-full p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-xs" />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeUnitConfig(config.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center" aria-label="Remove unit configuration">&times;</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addUnitConfig} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">+ Add Unit Type</button>
                            </div>
                             <div className="mt-4 text-sm font-semibold p-2 rounded-md bg-blue-600/20 text-blue-400">
                                <span>Total Units Configured per Floor: {totalUnitsPerFloorPerWing}</span>
                            </div>
                        </fieldset>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--light-bg)]">
                        {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-md text-sm text-center mb-4 border border-red-500/50 animate-pulse">{error}</div>}
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-5 py-2 rounded-md bg-gray-700 text-[var(--text-primary)] font-medium hover:bg-gray-600 transition-colors">Cancel</button>
                            <button type="submit" className="px-5 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors shadow-lg">
                                {initialWing ? 'Regenerate & Update' : 'Generate Inventory'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenerateInventoryModal;
