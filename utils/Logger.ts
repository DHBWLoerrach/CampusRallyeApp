/**
 * Logger-Wrapper für Development
 * 
 * Dieser Logger gibt nur im Development-Modus (__DEV__) Logs aus.
 * In Production-Builds werden keine Logs ausgegeben.
 * 
 * Verwendung:
 * ```typescript
 * import { Logger } from '@/utils/Logger';
 * 
 * Logger.debug('Navigation', 'Zurück zur Organisations-Auswahl');
 * Logger.info('AutoRefresh', 'Daten aktualisiert');
 * Logger.warn('Storage', 'Alte Daten gefunden');
 * Logger.error('API', 'Fehler beim Laden', error);
 * ```
 */

// __DEV__ ist eine globale Variable in React Native, die true ist wenn die App im Development-Modus läuft
declare const __DEV__: boolean;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  showTimestamp: boolean;
  showTag: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Standard-Konfiguration
const config: LoggerConfig = {
  enabled: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
  minLevel: 'debug',
  showTimestamp: true,
  showTag: true,
};

/**
 * Formatiert den Log-Output
 */
const formatMessage = (level: LogLevel, tag: string, message: string): string => {
  const parts: string[] = [];
  
  if (config.showTimestamp) {
    const now = new Date();
    const time = now.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
    parts.push(`[${time}]`);
  }
  
  parts.push(`[${level.toUpperCase()}]`);
  
  if (config.showTag && tag) {
    parts.push(`[${tag}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Prüft ob ein Log ausgegeben werden soll
 */
const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

/**
 * Der Logger mit verschiedenen Log-Levels
 */
export const Logger = {
  /**
   * Debug-Logs für detaillierte Entwicklungsinformationen
   * Wird nur im Development-Modus ausgegeben
   */
  debug: (tag: string, message: string, ...args: any[]): void => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', tag, message), ...args);
    }
  },

  /**
   * Info-Logs für allgemeine Informationen
   */
  info: (tag: string, message: string, ...args: any[]): void => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', tag, message), ...args);
    }
  },

  /**
   * Warn-Logs für Warnungen
   */
  warn: (tag: string, message: string, ...args: any[]): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', tag, message), ...args);
    }
  },

  /**
   * Error-Logs für Fehler
   * Diese werden auch in Production ausgegeben (für Crash-Reporting)
   */
  error: (tag: string, message: string, ...args: any[]): void => {
    // Errors werden immer geloggt (auch in Production)
    console.error(formatMessage('error', tag, message), ...args);
  },

  /**
   * Konfiguration ändern
   */
  configure: (newConfig: Partial<LoggerConfig>): void => {
    Object.assign(config, newConfig);
  },

  /**
   * Logger aktivieren/deaktivieren
   */
  setEnabled: (enabled: boolean): void => {
    config.enabled = enabled;
  },

  /**
   * Minimales Log-Level setzen
   */
  setMinLevel: (level: LogLevel): void => {
    config.minLevel = level;
  },
};

export default Logger;
