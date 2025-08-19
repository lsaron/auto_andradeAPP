from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import get_db
from app.models.mecanicos import Mecanico as MecanicoModel
from app.models.trabajos_mecanicos import TrabajoMecanico
from app.models.comisiones_mecanicos import ComisionMecanico
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from app.schemas.mecanicos import (
    MecanicoCreate, 
    MecanicoUpdate, 
    Mecanico as MecanicoSchema,
    MecanicoConEstadisticas,
    AsignacionMecanico,
    AsignacionMecanicoResponse
)
from app.services.mecanicos import MecanicoService
from typing import List, Optional
from datetime import datetime
import calendar

router = APIRouter(prefix="/mecanicos", tags=["mecanicos"])

@router.post("/", response_model=MecanicoSchema)
def crear_mecanico(mecanico: MecanicoCreate, db: Session = Depends(get_db)):
    """Crear un nuevo mecánico"""
    try:
        # Verificar que no exista un mecánico con el mismo ID nacional
        mecanico_existente = MecanicoService.obtener_mecanico_por_id_nacional(db, mecanico.id_nacional)
        if mecanico_existente:
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe un mecánico con el ID nacional {mecanico.id_nacional}"
            )
        
        return MecanicoService.crear_mecanico(db, mecanico)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[MecanicoSchema])
def listar_mecanicos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    activo: Optional[bool] = Query(True),
    db: Session = Depends(get_db)
):
    """Listar todos los mecánicos con paginación"""
    return MecanicoService.listar_mecanicos(db, skip=skip, limit=limit, activo=activo)

@router.get("/{mecanico_id}", response_model=MecanicoSchema)
def obtener_mecanico(mecanico_id: int, db: Session = Depends(get_db)):
    """Obtener un mecánico específico por ID"""
    mecanico = MecanicoService.obtener_mecanico(db, mecanico_id)
    if not mecanico:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    return mecanico

@router.put("/{mecanico_id}", response_model=MecanicoSchema)
def actualizar_mecanico(
    mecanico_id: int, 
    mecanico_data: MecanicoUpdate, 
    db: Session = Depends(get_db)
):
    """Actualizar un mecánico existente"""
    mecanico = MecanicoService.actualizar_mecanico(db, mecanico_id, mecanico_data)
    if not mecanico:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    return mecanico

@router.delete("/{mecanico_id}")
def eliminar_mecanico(mecanico_id: int, db: Session = Depends(get_db)):
    """Eliminar un mecánico (marcar como inactivo)"""
    success = MecanicoService.eliminar_mecanico(db, mecanico_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    return {"message": "Mecánico eliminado exitosamente"}

@router.get("/{mecanico_id}/estadisticas", response_model=MecanicoConEstadisticas)
def obtener_estadisticas_mecanico(
    mecanico_id: int,
    mes: Optional[str] = Query(None, description="Formato: YYYY-MM"),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de un mecánico (trabajos, ganancias, comisiones)"""
    try:
        return MecanicoService.obtener_estadisticas_mecanico(db, mecanico_id, mes)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reporte/mensual/{mes}", response_model=List[MecanicoConEstadisticas])
def obtener_reporte_mensual(mes: str, db: Session = Depends(get_db)):
    """Obtener reporte mensual de todos los mecánicos"""
    try:
        return MecanicoService.obtener_reporte_mensual(db, mes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/buscar/", response_model=List[MecanicoSchema])
def buscar_mecanicos(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Buscar mecánicos por nombre o ID nacional"""
    return MecanicoService.buscar_mecanicos(db, q, limit)

@router.post("/trabajos/{trabajo_id}/asignar", response_model=List[AsignacionMecanicoResponse])
def asignar_mecanicos_a_trabajo(
    trabajo_id: int,
    mecanicos: List[AsignacionMecanico],
    db: Session = Depends(get_db)
):
    """Asignar múltiples mecánicos a un trabajo y calcular comisiones automáticamente"""
    print(f"🚨🚨🚨 ENDPOINT LLAMADO - Trabajo {trabajo_id} - Mecánicos: {mecanicos}")
    print(f"🔍 API: Endpoint llamado para trabajo {trabajo_id}")
    print(f"🔍 API: Mecánicos recibidos: {mecanicos}")
    print(f"🔍 API: Tipo de trabajo_id: {type(trabajo_id)}")
    print(f"🔍 API: Tipo de mecanicos: {type(mecanicos)}")
    print(f"🔍 API: Longitud de mecanicos: {len(mecanicos) if mecanicos else 0}")
    
    if mecanicos:
        print(f"🔍 API: Primer mecánico: {mecanicos[0]}")
        print(f"🔍 API: Tipo del primer mecánico: {type(mecanicos[0])}")
        print(f"🔍 API: Atributos del primer mecánico: {mecanicos[0].__dict__ if hasattr(mecanicos[0], '__dict__') else 'No tiene __dict__'}")
        
        # Log detallado de cada campo
        primer_mecanico = mecanicos[0]
        print(f"🔍 API: id_mecanico: {primer_mecanico.id_mecanico} (tipo: {type(primer_mecanico.id_mecanico)})")
        print(f"🔍 API: porcentaje_comision: {primer_mecanico.porcentaje_comision} (tipo: {type(primer_mecanico.porcentaje_comision)})")
    
    try:
        print(f"🔍 API: Iniciando procesamiento...")
        mecanicos_ids = [m.id_mecanico for m in mecanicos]
        print(f"🔍 API: IDs de mecánicos extraídos: {mecanicos_ids}")
        print(f"🔍 API: Tipo de mecanicos_ids: {type(mecanicos_ids)}")
        
        # Verificar que el trabajo existe antes de continuar
        trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
        if not trabajo:
            print(f"❌ API: Trabajo {trabajo_id} no encontrado en la base de datos")
            raise HTTPException(status_code=404, detail=f"Trabajo {trabajo_id} no encontrado")
        
        print(f"✅ API: Trabajo {trabajo_id} encontrado - Descripción: {trabajo.descripcion}")
        
        print(f"🔍 API: Llamando al servicio...")
        asignaciones = MecanicoService.asignar_mecanicos_a_trabajo(db, trabajo_id, mecanicos_ids)
        print(f"🔍 API: Asignaciones retornadas del servicio: {len(asignaciones)}")
        
        # Construir respuesta con detalles
        respuesta = []
        for asignacion in asignaciones:
            print(f"🔍 API: Procesando asignación: {asignacion.__dict__}")
            
            mecanico = MecanicoService.obtener_mecanico(db, asignacion.id_mecanico)
            if mecanico:
                print(f"🔍 API: Mecánico encontrado: {mecanico.nombre}")
                
                respuesta_item = AsignacionMecanicoResponse(
                    id_trabajo=asignacion.id_trabajo,
                    id_mecanico=asignacion.id_mecanico,
                    nombre_mecanico=mecanico.nombre,
                    porcentaje_comision=asignacion.porcentaje_comision,
                    monto_comision=asignacion.monto_comision,
                    ganancia_trabajo=asignacion.monto_comision / (asignacion.porcentaje_comision / 100)
                )
                respuesta.append(respuesta_item)
                print(f"🔍 API: Respuesta construida: {respuesta_item.__dict__}")
            else:
                print(f"❌ API: Mecánico {asignacion.id_mecanico} no encontrado")
        
        print(f"✅ API: Respuesta final con {len(respuesta)} elementos")
        return respuesta
        
    except ValueError as e:
        print(f"❌ API: Error de valor: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ API: Error general: {e}")
        print(f"❌ API: Tipo de error: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{mecanico_id}/trabajos")
def obtener_trabajos_mecanico(
    mecanico_id: int,
    db: Session = Depends(get_db)
):
    """Obtener todos los trabajos realizados por un mecánico específico"""
    try:
        # Verificar que el mecánico existe
        mecanico = db.query(MecanicoModel).filter(MecanicoModel.id == mecanico_id).first()
        if not mecanico:
            raise HTTPException(status_code=404, detail="Mecánico no encontrado")
        
        # Obtener los trabajos asignados al mecánico
        trabajos_mecanico = db.query(TrabajoMecanico).filter(
            TrabajoMecanico.id_mecanico == mecanico_id
        ).all()
        
        # Obtener los detalles de cada trabajo
        trabajos_detallados = []
        for trabajo_mecanico in trabajos_mecanico:
            trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_mecanico.id_trabajo).first()
            if trabajo:
                # Calcular ganancia base (costo total - gastos reales)
                gastos_reales = db.query(DetalleGasto).filter(
                    DetalleGasto.id_trabajo == trabajo.id
                ).with_entities(func.sum(DetalleGasto.monto)).scalar() or 0
                
                ganancia_base = float(trabajo.costo or 0) - float(gastos_reales)
                
                trabajo_info = {
                    "id": trabajo.id,
                    "fecha": trabajo.fecha.isoformat() if trabajo.fecha else None,
                    "matricula_carro": trabajo.matricula_carro,
                    "descripcion": trabajo.descripcion,
                    "costo": float(trabajo.costo or 0),
                    "ganancia_base": ganancia_base,
                    "comision": float(trabajo_mecanico.monto_comision or 0),
                    "porcentaje_comision": float(trabajo_mecanico.porcentaje_comision or 0)
                }
                trabajos_detallados.append(trabajo_info)
        
        return trabajos_detallados
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
