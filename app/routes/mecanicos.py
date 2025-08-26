from fastapi import APIRouter, Depends, HTTPException, Query, Body
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
        service = MecanicoService(db)
        # Verificar que no exista un mecánico con el mismo nombre
        mecanicos_existentes = service.obtener_todos_los_mecanicos()
        if any(m['nombre'] == mecanico.nombre for m in mecanicos_existentes):
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe un mecánico con el nombre {mecanico.nombre}"
            )
        
        resultado = service.crear_mecanico({
            "nombre": mecanico.nombre,
            "telefono": mecanico.telefono,
            "especialidad": mecanico.especialidad,
            "fecha_contratacion": mecanico.fecha_contratacion
        })
        
        # Retornar el mecánico creado en el formato esperado
        return MecanicoSchema(
            id=resultado["id"],
            nombre=resultado["nombre"],
            telefono=resultado.get("telefono"),
            especialidad=resultado.get("especialidad"),
            fecha_contratacion=resultado.get("fecha_contratacion"),
            activo=True
        )
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
    service = MecanicoService(db)
    mecanicos = service.obtener_todos_los_mecanicos()
    
    # Aplicar filtros
    if activo is not None:
        # Por ahora todos los mecánicos se consideran activos
        pass
    
    # Aplicar paginación
    mecanicos_paginados = mecanicos[skip:skip + limit]
    
    # Convertir al formato esperado
    resultado = []
    for mecanico in mecanicos_paginados:
        resultado.append(MecanicoSchema(
            id=mecanico["id"],
            nombre=mecanico["nombre"],
            telefono=mecanico.get("telefono"),
            especialidad=mecanico.get("especialidad"),
            fecha_contratacion=mecanico.get("fecha_contratacion"),
            activo=True
        ))
    
    return resultado

@router.get("/{mecanico_id}", response_model=MecanicoSchema)
def obtener_mecanico(mecanico_id: int, db: Session = Depends(get_db)):
    """Obtener un mecánico específico por ID"""
    service = MecanicoService(db)
    mecanico = service.obtener_mecanico_por_id(mecanico_id)
    if not mecanico:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    
    # Convertir al formato esperado
    return MecanicoSchema(
        id=mecanico["id"],
        nombre=mecanico["nombre"],
        telefono=mecanico.get("telefono"),
        especialidad=mecanico.get("especialidad"),
        fecha_contratacion=mecanico.get("fecha_contratacion"),
        activo=True
    )

@router.put("/{mecanico_id}", response_model=MecanicoSchema)
def actualizar_mecanico(
    mecanico_id: int, 
    mecanico_data: MecanicoUpdate, 
    db: Session = Depends(get_db)
):
    """Actualizar un mecánico existente"""
    service = MecanicoService(db)
    resultado = service.actualizar_mecanico(mecanico_id, mecanico_data.dict(exclude_unset=True))
    if "error" in resultado:
        raise HTTPException(status_code=404, detail=resultado["error"])
    
    # Obtener el mecánico actualizado
    mecanico_actualizado = service.obtener_mecanico_por_id(mecanico_id)
    if not mecanico_actualizado:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    
    return MecanicoSchema(
        id=mecanico_actualizado["id"],
        nombre=mecanico_actualizado["nombre"],
        telefono=mecanico_actualizado.get("telefono"),
        especialidad=mecanico_actualizado.get("especialidad"),
        fecha_contratacion=mecanico_actualizado.get("fecha_contratacion"),
        activo=True
    )

@router.delete("/{mecanico_id}")
def eliminar_mecanico(mecanico_id: int, db: Session = Depends(get_db)):
    """Eliminar un mecánico (solo si no tiene comisiones asociadas)"""
    service = MecanicoService(db)
    resultado = service.eliminar_mecanico(mecanico_id)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    
    return {"message": "Mecánico eliminado exitosamente"}

@router.get("/{mecanico_id}/estadisticas", response_model=MecanicoConEstadisticas)
def obtener_estadisticas_mecanico(
    mecanico_id: int,
    mes: Optional[str] = Query(None, description="Formato: YYYY-MM"),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de un mecánico (trabajos, ganancias, comisiones)"""
    try:
        service = MecanicoService(db)
        mecanico = service.obtener_mecanico_por_id(mecanico_id)
        if not mecanico:
            raise HTTPException(status_code=404, detail="Mecánico no encontrado")
        
        # Obtener comisiones del mecánico
        comisiones = service.obtener_comisiones_mecanico(mecanico_id)
        
        # Calcular estadísticas básicas
        total_comisiones = sum(c["monto_comision"] for c in comisiones)
        total_trabajos = len(comisiones)
        
        # Filtrar por mes si se especifica
        if mes:
            comisiones_mes = [c for c in comisiones if c["fecha_trabajo"] and c["fecha_trabajo"].startswith(mes)]
            total_comisiones = sum(c["monto_comision"] for c in comisiones_mes)
            total_trabajos = len(comisiones_mes)
        
        return MecanicoConEstadisticas(
            id=mecanico["id"],
            nombre=mecanico["nombre"],
            telefono=mecanico.get("telefono"),
            porcentaje_comision=mecanico.get("porcentaje_comision"),
            fecha_contratacion=mecanico.get("fecha_contratacion"),
            activo=True,
            total_trabajos=total_trabajos,
            total_ganancias=total_comisiones,
            comisiones_mes=total_comisiones
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reporte/mensual/{mes}", response_model=List[MecanicoConEstadisticas])
def obtener_reporte_mensual(mes: str, db: Session = Depends(get_db)):
    """Obtener reporte mensual de todos los mecánicos"""
    try:
        service = MecanicoService(db)
        mecanicos = service.obtener_todos_los_mecanicos()
        
        resultado = []
        for mecanico in mecanicos:
            # Obtener estadísticas del mecánico para el mes
            comisiones = service.obtener_comisiones_mecanico(mecanico["id"])
            comisiones_mes = [c for c in comisiones if c["fecha_trabajo"] and c["fecha_trabajo"].startswith(mes)]
            
            total_comisiones = sum(c["monto_comision"] for c in comisiones_mes)
            total_trabajos = len(comisiones_mes)
            
            resultado.append(MecanicoConEstadisticas(
                id=mecanico["id"],
                nombre=mecanico["nombre"],
                telefono=mecanico.get("telefono"),
                porcentaje_comision=mecanico.get("porcentaje_comision"),
                fecha_contratacion=mecanico.get("fecha_contratacion"),
                activo=True,
                total_trabajos=total_trabajos,
                total_ganancias=total_comisiones,
                comisiones_mes=total_comisiones
            ))
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/buscar/", response_model=List[MecanicoSchema])
def buscar_mecanicos(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Buscar mecánicos por nombre o especialidad"""
    service = MecanicoService(db)
    mecanicos = service.obtener_todos_los_mecanicos()
    
    # Filtrar por término de búsqueda
    resultados = []
    for mecanico in mecanicos:
        if (q.lower() in mecanico["nombre"].lower() or 
            (mecanico.get("porcentaje_comision") and q.lower() in str(mecanico["porcentaje_comision"]).lower())):
            resultados.append(MecanicoSchema(
                id=mecanico["id"],
                nombre=mecanico["nombre"],
                telefono=mecanico.get("telefono"),
                porcentaje_comision=mecanico.get("porcentaje_comision"),
                fecha_contratacion=mecanico.get("fecha_contratacion"),
                activo=True
            ))
    
    return resultados[:limit]

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
        service = MecanicoService(db)
        resultado = service.asignar_mecanico_trabajo(trabajo_id, mecanicos_ids[0])  # Por ahora solo el primero
        
        if "error" in resultado:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        print(f"🔍 API: Resultado del servicio: {resultado}")
        
        # Construir respuesta
        respuesta = [AsignacionMecanicoResponse(
            id_trabajo=trabajo_id,
            id_mecanico=mecanicos_ids[0],
            nombre_mecanico="Mecánico",  # Se puede obtener del servicio si es necesario
            porcentaje_comision=2.0,
            monto_comision=resultado["comision_calculada"],
            ganancia_trabajo=resultado["comision_calculada"] / 0.02
        )]
        
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

@router.put("/trabajos/{trabajo_id}/actualizar-comisiones")
def actualizar_comisiones_trabajo(
    trabajo_id: int,
    mecanicos: List[AsignacionMecanico],
    db: Session = Depends(get_db)
):
    """Actualizar comisiones existentes de un trabajo (para edición) en lugar de crear nuevas"""
    try:
        print(f"🔍 API: Actualizando comisiones para trabajo {trabajo_id}")
        print(f"🔍 API: Mecánicos recibidos: {mecanicos}")
        
        mecanicos_ids = [m.id_mecanico for m in mecanicos]
        print(f"🔍 API: IDs de mecánicos extraídos: {mecanicos_ids}")
        
        # Verificar que el trabajo existe
        trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
        if not trabajo:
            raise HTTPException(status_code=404, detail=f"Trabajo {trabajo_id} no encontrado")
        
        print(f"✅ API: Trabajo {trabajo_id} encontrado - Descripción: {trabajo.descripcion}")
        
        # Llamar al servicio para actualizar comisiones
        service = MecanicoService(db)
        resultado = service.actualizar_comisiones_trabajo(trabajo_id, mecanicos_ids)
        print(f"✅ API: Comisiones actualizadas - {resultado}")
        
        return {
            "message": f"Comisiones actualizadas para trabajo {trabajo_id}",
            "resultado": resultado
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ API: Error al actualizar comisiones: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trabajos/{trabajo_id}/asignados")
def obtener_mecanicos_asignados_trabajo(
    trabajo_id: int,
    db: Session = Depends(get_db)
):
    """Obtener los mecánicos asignados a un trabajo específico"""
    try:
        # Verificar que el trabajo existe
        trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
        if not trabajo:
            raise HTTPException(status_code=404, detail=f"Trabajo {trabajo_id} no encontrado")
        
        # Obtener los mecánicos asignados al trabajo desde comisiones
        service = MecanicoService(db)
        comisiones = db.query(ComisionMecanico).filter(
            ComisionMecanico.id_trabajo == trabajo_id
        ).all()
        
        # Construir respuesta con detalles de cada mecánico
        respuesta = []
        for comision in comisiones:
            mecanico = service.obtener_mecanico_por_id(comision.id_mecanico)
            
            if mecanico:
                respuesta_item = {
                    "id_mecanico": comision.id_mecanico,
                    "nombre_mecanico": mecanico["nombre"],
                    "porcentaje_comision": float(comision.porcentaje_comision),
                    "monto_comision": float(comision.monto_comision),
                    "fecha_asignacion": comision.fecha_calculo.isoformat() if comision.fecha_calculo else None
                }
                respuesta.append(respuesta_item)
        
        return respuesta
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{mecanico_id}/trabajos")
def obtener_trabajos_mecanico(
    mecanico_id: int,
    db: Session = Depends(get_db)
):
    """Obtener los trabajos asignados a un mecánico específico"""
    try:
        service = MecanicoService(db)
        
        # Verificar que el mecánico existe
        mecanico = service.obtener_mecanico_por_id(mecanico_id)
        if not mecanico:
            raise HTTPException(status_code=404, detail="Mecánico no encontrado")
        
        # Obtener las comisiones del mecánico
        comisiones = service.obtener_comisiones_mecanico(mecanico_id)
        
        # Obtener los detalles de cada trabajo
        trabajos_detallados = []
        for comision in comisiones:
            trabajo = db.query(Trabajo).filter(Trabajo.id == comision["id_trabajo"]).first()
            if trabajo:
                # Calcular gastos reales del trabajo
                gastos_reales = db.query(DetalleGasto).filter(
                    DetalleGasto.id_trabajo == trabajo.id
                ).with_entities(func.sum(DetalleGasto.monto)).scalar() or 0
                
                # ✅ CORRECTO: Ganancia base = Mano de Obra - Gastos Reales
                mano_obra = float(trabajo.mano_obra or 0)
                gastos_reales_float = float(gastos_reales)
                ganancia_base = mano_obra - gastos_reales_float
                
                # ✅ CORRECTO: Comisión = 2% sobre la ganancia base, dividida entre todos los mecánicos del trabajo
                # Primero calcular cuántos mecánicos están asignados a este trabajo
                total_mecanicos_trabajo = db.query(ComisionMecanico).filter(
                    ComisionMecanico.id_trabajo == trabajo.id
                ).count()
                
                # Calcular comisión total y dividirla entre los mecánicos
                comision_total = ganancia_base * 0.02 if ganancia_base > 0 else 0
                comision_por_mecanico = comision_total / total_mecanicos_trabajo if total_mecanicos_trabajo > 0 else 0
                
                trabajo_info = {
                    "id": trabajo.id,
                    "fecha": trabajo.fecha.isoformat() if trabajo.fecha else None,
                    "matricula_carro": trabajo.matricula_carro,
                    "descripcion": trabajo.descripcion,
                    "costo": float(trabajo.costo or 0),
                    "mano_obra": mano_obra,
                    "total_gastos": gastos_reales_float,
                    "ganancia_base": ganancia_base,
                    "comision": comision_por_mecanico,
                    "porcentaje_comision": 2.0,  # 2% fijo
                    "total_mecanicos_trabajo": total_mecanicos_trabajo,  # Número de mecánicos en este trabajo
                    "comision_total_trabajo": comision_total  # Comisión total del trabajo (antes de dividir)
                }
                trabajos_detallados.append(trabajo_info)
        
        return trabajos_detallados
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{mecanico_id}/comisiones/{comision_id}/estado")
def cambiar_estado_comision_mecanico(
    mecanico_id: int,
    comision_id: int,
    nuevo_estado: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Cambiar el estado de una comisión específica de un mecánico"""
    try:
        service = MecanicoService(db)
        resultado = service.cambiar_estado_comision(comision_id, nuevo_estado)
        
        if "error" in resultado:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{mecanico_id}/comisiones/quincena/{quincena}")
def obtener_comisiones_quincena_mecanico(
    mecanico_id: int,
    quincena: str,
    db: Session = Depends(get_db)
):
    """Obtener las comisiones de un mecánico para una quincena específica"""
    try:
        service = MecanicoService(db)
        comisiones = service.obtener_comisiones_quincena_mecanico(mecanico_id, quincena)
        return comisiones
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
