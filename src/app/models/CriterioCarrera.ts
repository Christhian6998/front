import { Carrera } from "./Carrera";
import { Criterio } from "./Criterio";

export interface CriterioCarrera {
    idCritCarrera?: number
    peso: number
    criterio: Partial<Criterio>
    carrera: Partial<Carrera>
}