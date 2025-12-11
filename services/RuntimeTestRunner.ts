
import { createPersonJSON, createPersonEntity, updateWorldState, calculateWorkPoints } from './gameService';
import { GAME_CONFIG } from '../gameConfig';
import { EntityType, Gender } from '../types';

/**
 * Runtime Test Runner
 * Executes a suite of sanity checks in the browser console on startup.
 * Ensures critical game logic (Death, Scoring, Physics) is operational.
 */
export class RuntimeTestRunner {
    
    static runStartupTests() {
        console.groupCollapsed("🧪 KAMI: Executing Runtime Self-Tests...");
        let passed = 0;
        let failed = 0;

        const assert = (description: string, condition: boolean) => {
            if (condition) {
                console.log(`%c✔ PASS: ${description}`, 'color: green');
                passed++;
            } else {
                console.error(`❌ FAIL: ${description}`);
                failed++;
            }
        };

        try {
            // TEST 1: Scoring Math
            const greenScore = calculateWorkPoints(100);
            assert("Green Land yields correct points", greenScore === GAME_CONFIG.SCORING.GREEN_TICK);
            
            const yellowScore = calculateWorkPoints(0);
            assert("Yellow Land yields correct points", yellowScore === GAME_CONFIG.SCORING.YELLOW_TICK);

            // TEST 2: Energy Decay Simulation
            const startAttr = createPersonJSON(Gender.MALE);
            const entity = createPersonEntity(startAttr, { x: 0, y: 0 });
            const initialEnergy = entity.attributes!.energia;
            
            // Run one frame of update
            const result = updateWorldState([entity], 1, 100);
            
            // Check if entities array exists and has elements
            if (!result.entities || result.entities.length === 0) {
                throw new Error("updateWorldState returned no entities in Test 2");
            }

            const updatedEnergy = result.entities[0].attributes!.energia;
            
            assert("Bio-Bot consumes energy on idle update", updatedEnergy < initialEnergy);

            // TEST 3: Auto-Death Logic Simulation
            const dyingEntity = createPersonEntity(createPersonJSON(Gender.FEMALE), { x: 0, y: 0 });
            dyingEntity.attributes!.energia = 0;
            // Mock time: 1ms before death threshold
            const now = Date.now();
            dyingEntity.attributes!.zeroEnergySince = now - GAME_CONFIG.DEATH.TIME_TO_DIE_MS + 1000;
            
            const stillAliveResult = updateWorldState([dyingEntity], 1, 100, now);
            if (!stillAliveResult.entities || stillAliveResult.entities.length === 0) {
                 throw new Error("updateWorldState returned no entities in Test 3 (Alive check)");
            }
            assert("Bot stays alive before death timer expires", stillAliveResult.entities[0].attributes!.estado !== 'muerto');

            // Mock time: 1ms AFTER death threshold
            const deadTime = now + 2000; 
            const deadResult = updateWorldState([dyingEntity], 1, 100, deadTime);
            
            if (!deadResult.entities || deadResult.entities.length === 0) {
                 throw new Error("updateWorldState returned no entities in Test 3 (Death check)");
            }

            assert("Bot dies after death timer expires", deadResult.entities[0].attributes!.estado === 'muerto');

            // TEST 4: Land Decay Logic
            assert("Land Decay config is valid (>0)", GAME_CONFIG.LAND.DECAY_TIMEOUT_MS > 0);

        } catch (e) {
            console.error("Critical Test Runner Error", e);
            failed++;
        }

        console.log(`%cTests Complete: ${passed} Passed, ${failed} Failed`, failed > 0 ? 'font-weight:bold; color:red' : 'font-weight:bold; color:green');
        console.groupEnd();
    }
}
