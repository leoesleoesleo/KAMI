

import { describe, it, expect } from 'vitest';
import { 
    createPersonJSON, 
    createPersonEntity, 
    createLandEntity, 
    processBioBot,
    processLandDecay,
    processDeathLifecycle,
    calculateWorkPoints,
    updateWorldState
} from '../services/gameService';
import { Gender, EntityType } from '../types';
import { GAME_CONFIG } from '../gameConfig';

describe('KAMI Game Mechanics Engine', () => {

  describe('1. Lifecycle & Death System', () => {
    
    it('debería marcar como muerto si la energía es 0 por más de TIME_TO_DIE_MS', () => {
        const now = 1000000;
        const entity = createPersonEntity(createPersonJSON(Gender.MALE), {x:0, y:0});
        entity.attributes!.energia = 0;
        entity.attributes!.zeroEnergySince = now - GAME_CONFIG.DEATH.TIME_TO_DIE_MS - 1; // Expired

        processDeathLifecycle(entity, entity.attributes!, now);

        expect(entity.attributes!.estado).toBe('muerto');
        expect(entity.attributes!.deathTimestamp).toBe(now);
    });

    it('NO debería marcar como muerto si el tiempo a 0 energía es insuficiente', () => {
        const now = 1000000;
        const entity = createPersonEntity(createPersonJSON(Gender.MALE), {x:0, y:0});
        entity.attributes!.energia = 0;
        entity.attributes!.zeroEnergySince = now - GAME_CONFIG.DEATH.TIME_TO_DIE_MS + 5000; // Not expired

        processDeathLifecycle(entity, entity.attributes!, now);

        expect(entity.attributes!.estado).not.toBe('muerto');
    });

    it('debería eliminar la entidad (return true) solo después de la fase de desvanecimiento', () => {
        const now = 2000000;
        const entity = createPersonEntity(createPersonJSON(Gender.MALE), {x:0, y:0});
        entity.attributes!.estado = 'muerto';
        entity.attributes!.deathTimestamp = now - GAME_CONFIG.DEATH.TIME_FROZEN_MS - GAME_CONFIG.DEATH.FADE_DURATION_MS - 100;

        const shouldRemove = processDeathLifecycle(entity, entity.attributes!, now);
        expect(shouldRemove).toBe(true);
    });

    it('debería mantener la entidad (return false) durante la fase congelada', () => {
        const now = 2000000;
        const entity = createPersonEntity(createPersonJSON(Gender.MALE), {x:0, y:0});
        entity.attributes!.estado = 'muerto';
        entity.attributes!.deathTimestamp = now - GAME_CONFIG.DEATH.TIME_FROZEN_MS + 1000; // Still frozen

        const shouldRemove = processDeathLifecycle(entity, entity.attributes!, now);
        expect(shouldRemove).toBe(false);
    });
  });

  describe('2. Land Decay System', () => {
      it('debería eliminar tierras vacías después del tiempo de decaimiento', () => {
          const now = 5000000;
          const land = createLandEntity({x:0,y:0});
          land.landAttributes!.resourceLevel = 0;
          land.landAttributes!.emptySince = now - GAME_CONFIG.LAND.DECAY_TIMEOUT_MS - 1;

          const shouldRemove = processLandDecay(land, now);
          expect(shouldRemove).toBe(true);
      });

      it('NO debería eliminar tierras con recursos', () => {
          const now = 5000000;
          const land = createLandEntity({x:0,y:0});
          land.landAttributes!.resourceLevel = 50; // Has resources
          land.landAttributes!.emptySince = now - 9999999; // Old timestamp shouldn't matter if resources exist

          const shouldRemove = processLandDecay(land, now);
          expect(shouldRemove).toBe(false);
          expect(land.landAttributes!.emptySince).toBeUndefined(); // Should reset timer
      });
  });

  describe('3. Scoring System', () => {
      it('debería otorgar puntos correctos según el estado del cultivo', () => {
          expect(calculateWorkPoints(100)).toBe(GAME_CONFIG.SCORING.GREEN_TICK);
          expect(calculateWorkPoints(50)).toBe(GAME_CONFIG.SCORING.PINK_TICK);
          expect(calculateWorkPoints(0)).toBe(GAME_CONFIG.SCORING.YELLOW_TICK);
      });

      it('debería acumular puntos en el biobot cuando trabaja', () => {
          const now = 1000;
          const bot = createPersonEntity(createPersonJSON(Gender.FEMALE), {x:0, y:0});
          bot.attributes!.estado = 'trabajando';
          bot.attributes!.individualScore = 0;

          const land = createLandEntity({x:0,y:0});
          land.landAttributes!.resourceLevel = 100;

          // Process one frame
          processBioBot(bot, [land], now, 1, 100);

          expect(bot.attributes!.individualScore).toBeGreaterThan(0);
          expect(bot.attributes!.individualScore).toBeCloseTo(GAME_CONFIG.SCORING.GREEN_TICK);
      });
  });

  describe('4. Physics & Energy', () => {
      it('debería reducir energía al moverse', () => {
          const bot = createPersonEntity(createPersonJSON(Gender.MALE), {x:0, y:0});
          bot.attributes!.estado = 'caminando';
          const startEnergy = bot.attributes!.energia;

          processBioBot(bot, [], 0, 1, 100);

          expect(bot.attributes!.energia).toBeLessThan(startEnergy);
      });

      it('debería detener el trabajo si el tiempo expira', () => {
          const now = 5000;
          const bot = createPersonEntity(createPersonJSON(Gender.MALE), {x:0, y:0});
          bot.attributes!.estado = 'trabajando';
          bot.attributes!.workEndTime = now - 1; // Expired

          processBioBot(bot, [], now, 1, 100);

          expect(bot.attributes!.estado).toBe('ocioso');
          expect(bot.attributes!.workEndTime).toBeUndefined();
      });
  });
  
  describe('5. Combat & Global Energy Cost', () => {
      it('debería retornar entidades y consumo de energía del jugador', () => {
          const result = updateWorldState([], 1, 100);
          expect(result).toHaveProperty('entities');
          expect(result).toHaveProperty('playerEnergyConsumed');
          expect(Array.isArray(result.entities)).toBe(true);
          expect(typeof result.playerEnergyConsumed).toBe('number');
      });
  });

});