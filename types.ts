export type EORMechanism = 'wettability' | 'tension' | 'emulsification' | 'general';

export interface SimulationConfig {
  mechanism: EORMechanism;
  oilColor: string;
  waterColor: string;
  surfactantColor: string;
  rockColor: string;        // New: Rock color
  flowSpeed: number;
  turbulence: number;
  oilDensity: number;
  surfactantDensity: number;
  viscosity: number;
  poreWidth: number;        // 0.0 to 1.0 (1.0 is wide open, 0.2 is very narrow constrict)
}

export interface ExplanationResponse {
  explanation: string;
  simulationParams: SimulationConfig;
}

export interface VisualState {
  isLoading: boolean;
  config: SimulationConfig | null;
  error: string | null;
}

export interface TextState {
  isLoading: boolean;
  content: string | null;
  error: string | null;
}