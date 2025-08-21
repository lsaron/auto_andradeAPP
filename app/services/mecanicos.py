from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timezone
from app.models.mecanicos import Mecanico
from app.models.trabajos_mecanicos import TrabajoMecanico
from app.models.comisiones_mecanicos import ComisionMecanico
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from app.schemas.mecanicos import MecanicoCreate, MecanicoUpdate, MecanicoConEstadisticas
import calendar

class MecanicoService:
    
    @staticmethod
    def crear_mecanico(db: Session, mecanico_data: MecanicoCreate) -> Mecanico:
        """Crear un nuevo mecánico"""
        db_mecanico = Mecanico(**mecanico_data.dict())
        db.add(db_mecanico)
        db.commit()
        db.refresh(db_mecanico)
        return db_mecanico
    
    @staticmethod
    def obtener_mecanico(db: Session, mecanico_id: int) -> Optional[Mecanico]:
        """Obtener un mecánico por ID"""
        return db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
    
    @staticmethod
    def obtener_mecanico_por_id_nacional(db: Session, id_nacional: str) -> Optional[Mecanico]:
        """Obtener un mecánico por ID nacional"""
        return db.query(Mecanico).filter(Mecanico.id_nacional == id_nacional).first()
    
    @staticmethod
    def listar_mecanicos(db: Session, skip: int = 0, limit: int = 100, activo: bool = True) -> List[Mecanico]:
        """Listar todos los mecánicos activos"""
        query = db.query(Mecanico)
        if activo is not None:
            query = query.filter(Mecanico.activo == activo)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def actualizar_mecanico(db: Session, mecanico_id: int, mecanico_data: MecanicoUpdate) -> Optional[Mecanico]:
        """Actualizar un mecánico"""
        db_mecanico = db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not db_mecanico:
            return None
        
        update_data = mecanico_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_mecanico, field, value)
        
        db_mecanico.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_mecanico)
        return db_mecanico
    
    @staticmethod
    def eliminar_mecanico(db: Session, mecanico_id: int) -> bool:
        """Eliminar un mecánico (marcar como inactivo)"""
        db_mecanico = db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not db_mecanico:
            return False
        
        db_mecanico.activo = False
        db_mecanico.updated_at = datetime.now(timezone.utc)
        db.commit()
        return True
    
    @staticmethod
    def asignar_mecanicos_a_trabajo(db: Session, trabajo_id: int, mecanicos_ids: List[int]) -> List[TrabajoMecanico]:
        """Asignar múltiples mecánicos a un trabajo y calcular comisiones"""
        try:
            # Obtener el trabajo
            trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
            if not trabajo:
                raise ValueError("Trabajo no encontrado")
            
            # Calcular ganancia del trabajo (costo - gastos)
            gastos_totales = db.query(func.sum(DetalleGasto.monto)).filter(
                DetalleGasto.id_trabajo == trabajo_id
            ).scalar() or Decimal('0.00')
            
            # Ensure gastos_totales is Decimal, as scalar() might return float if the column is float
            if not isinstance(gastos_totales, Decimal):
                gastos_totales = Decimal(str(gastos_totales))
            
            # Convertir a Decimal para cálculos precisos
            costo_trabajo = Decimal(str(trabajo.costo))
            ganancia_trabajo = costo_trabajo - gastos_totales
            
            # Verificar que hay ganancia para calcular comisiones
            if ganancia_trabajo <= 0:
                ganancia_trabajo = Decimal('0.00')
            
            # Calcular comisión por mecánico (dividida equitativamente)
            comision_por_mecanico = ganancia_trabajo * Decimal('0.02') / len(mecanicos_ids)  # 2% dividido entre mecánicos
            
            # Eliminar asignaciones anteriores de trabajos_mecanicos
            asignaciones_anteriores = db.query(TrabajoMecanico).filter(TrabajoMecanico.id_trabajo == trabajo_id).all()
            
            for asignacion_anterior in asignaciones_anteriores:
                db.delete(asignacion_anterior)
            
            # Eliminar comisiones anteriores
            comisiones_anteriores = db.query(ComisionMecanico).filter(ComisionMecanico.id_trabajo == trabajo_id).all()
            
            for comision_anterior in comisiones_anteriores:
                db.delete(comision_anterior)
            
            # Hacer commit de las eliminaciones
            db.commit()
            
            # Crear nuevas asignaciones
            asignaciones = []
            for mecanico_id in mecanicos_ids:
                # Verificar que el mecánico existe y está activo
                mecanico = db.query(Mecanico).filter(
                    and_(Mecanico.id == mecanico_id, Mecanico.activo == True)
                ).first()
                
                if not mecanico:
                    continue
                
                # Crear asignación en trabajos_mecanicos
                asignacion = TrabajoMecanico(
                    id_trabajo=trabajo_id,
                    id_mecanico=mecanico_id,
                    porcentaje_comision=Decimal('2.00'),
                    monto_comision=comision_por_mecanico
                )
                
                db.add(asignacion)
                asignaciones.append(asignacion)
                
                # Crear registro de comisión en comisiones_mecanicos
                comision = ComisionMecanico(
                    id_trabajo=trabajo_id,
                    id_mecanico=mecanico_id,
                    ganancia_trabajo=ganancia_trabajo,
                    porcentaje_comision=Decimal('2.00'),
                    monto_comision=comision_por_mecanico,
                    mes_reporte=datetime.now(timezone.utc).strftime('%Y-%m')
                )
                
                db.add(comision)
            
            db.commit()
            return asignaciones
            
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def actualizar_comisiones_trabajo(db: Session, trabajo_id: int, mecanicos_ids: List[int]) -> List[TrabajoMecanico]:
        """Actualizar comisiones existentes de un trabajo (para edición) en lugar de crear nuevas"""
        try:
            # Obtener el trabajo
            trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
            if not trabajo:
                raise ValueError("Trabajo no encontrado")
            
            # Calcular ganancia del trabajo (costo - gastos)
            gastos_totales = db.query(func.sum(DetalleGasto.monto)).filter(
                DetalleGasto.id_trabajo == trabajo_id
            ).scalar() or Decimal('0.00')
            
            # Ensure gastos_totales is Decimal
            if not isinstance(gastos_totales, Decimal):
                gastos_totales = Decimal(str(gastos_totales))
            
            # Convertir a Decimal para cálculos precisos
            costo_trabajo = Decimal(str(trabajo.costo))
            ganancia_trabajo = costo_trabajo - gastos_totales
            
            # Verificar que hay ganancia para calcular comisiones
            if ganancia_trabajo <= 0:
                ganancia_trabajo = Decimal('0.00')
            
            # Calcular comisión por mecánico (dividida equitativamente)
            comision_por_mecanico = ganancia_trabajo * Decimal('0.02') / len(mecanicos_ids) if mecanicos_ids else Decimal('0.00')
            
            # Obtener asignaciones existentes
            asignaciones_existentes = db.query(TrabajoMecanico).filter(
                TrabajoMecanico.id_trabajo == trabajo_id
            ).all()
            
            # Obtener comisiones existentes
            comisiones_existentes = db.query(ComisionMecanico).filter(
                ComisionMecanico.id_trabajo == trabajo_id
            ).all()
            
            # Crear un mapa de mecánicos existentes para comparar
            mecanicos_existentes = {asignacion.id_mecanico: asignacion for asignacion in asignaciones_existentes}
            comisiones_existentes_map = {comision.id_mecanico: comision for comision in comisiones_existentes}
            
            # Lista para almacenar todas las asignaciones (existentes y nuevas)
            todas_asignaciones = []
            
            # Procesar cada mecánico solicitado
            for mecanico_id in mecanicos_ids:
                # Verificar que el mecánico existe y está activo
                mecanico = db.query(Mecanico).filter(
                    and_(Mecanico.id == mecanico_id, Mecanico.activo == True)
                ).first()
                
                if not mecanico:
                    continue
                
                if mecanico_id in mecanicos_existentes:
                    # Actualizar asignación existente
                    asignacion_existente = mecanicos_existentes[mecanico_id]
                    asignacion_existente.monto_comision = comision_por_mecanico
                    asignacion_existente.porcentaje_comision = Decimal('2.00')
                    todas_asignaciones.append(asignacion_existente)
                    
                    # Actualizar comisión existente
                    if mecanico_id in comisiones_existentes_map:
                        comision_existente = comisiones_existentes_map[mecanico_id]
                        comision_existente.ganancia_trabajo = ganancia_trabajo
                        comision_existente.monto_comision = comision_por_mecanico
                        comision_existente.fecha_calculo = datetime.now(timezone.utc)
                else:
                    # Crear nueva asignación
                    nueva_asignacion = TrabajoMecanico(
                        id_trabajo=trabajo_id,
                        id_mecanico=mecanico_id,
                        porcentaje_comision=Decimal('2.00'),
                        monto_comision=comision_por_mecanico
                    )
                    db.add(nueva_asignacion)
                    todas_asignaciones.append(nueva_asignacion)
                    
                    # Crear nueva comisión
                    nueva_comision = ComisionMecanico(
                        id_trabajo=trabajo_id,
                        id_mecanico=mecanico_id,
                        ganancia_trabajo=ganancia_trabajo,
                        porcentaje_comision=Decimal('2.00'),
                        monto_comision=comision_por_mecanico,
                        mes_reporte=datetime.now(timezone.utc).strftime('%Y-%m')
                    )
                    db.add(nueva_comision)
            
            # Eliminar asignaciones y comisiones de mecánicos que ya no están asignados
            for asignacion_existente in asignaciones_existentes:
                if asignacion_existente.id_mecanico not in mecanicos_ids:
                    db.delete(asignacion_existente)
            
            for comision_existente in comisiones_existentes:
                if comision_existente.id_mecanico not in mecanicos_ids:
                    db.delete(comision_existente)
            
            db.commit()
            return todas_asignaciones
            
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def obtener_estadisticas_mecanico(db: Session, mecanico_id: int, mes: Optional[str] = None) -> MecanicoConEstadisticas:
        """Obtener estadísticas de un mecánico (trabajos, ganancias, comisiones)"""
        mecanico = db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not mecanico:
            raise ValueError("Mecánico no encontrado")
        
        try:
            # Construir query base sin LIMIT
            query = db.query(
                func.count(ComisionMecanico.id).label('trabajos_completados'),
                func.sum(ComisionMecanico.ganancia_trabajo).label('total_ganancias'),
                func.sum(ComisionMecanico.monto_comision).label('total_comisiones')
            ).filter(ComisionMecanico.id_mecanico == mecanico_id)
            
            # Filtrar por mes si se especifica
            if mes:
                query = query.filter(ComisionMecanico.mes_reporte == mes)
            
            stats = query.first()
            
            # Crear objeto con estadísticas
            mecanico_con_stats = MecanicoConEstadisticas(
                id=mecanico.id,
                id_nacional=mecanico.id_nacional,
                nombre=mecanico.nombre,
                correo=mecanico.correo,
                telefono=mecanico.telefono,
                porcentaje_comision=mecanico.porcentaje_comision,
                fecha_contratacion=mecanico.fecha_contratacion,
                activo=mecanico.activo,
                created_at=mecanico.created_at,
                updated_at=mecanico.updated_at,
                trabajos_completados=stats.trabajos_completados or 0,
                total_ganancias=stats.total_ganancias or Decimal('0.00'),
                total_comisiones=stats.total_comisiones or Decimal('0.00')
            )
            
            return mecanico_con_stats
            
        except Exception as e:
            # En caso de error, retornar estadísticas con valores por defecto
            return MecanicoConEstadisticas(
                id=mecanico.id,
                id_nacional=mecanico.id_nacional,
                nombre=mecanico.nombre,
                correo=mecanico.correo,
                telefono=mecanico.telefono,
                porcentaje_comision=mecanico.porcentaje_comision,
                fecha_contratacion=mecanico.fecha_contratacion,
                activo=mecanico.activo,
                created_at=mecanico.created_at,
                updated_at=mecanico.updated_at,
                trabajos_completados=0,
                total_ganancias=Decimal('0.00'),
                total_comisiones=Decimal('0.00')
            )
    
    @staticmethod
    def obtener_reporte_mensual(db: Session, mes: str) -> List[MecanicoConEstadisticas]:
        """Obtener reporte mensual de todos los mecánicos"""
        mecanicos = db.query(Mecanico).filter(Mecanico.activo == True).all()
        reporte = []
        
        for mecanico in mecanicos:
            try:
                stats = MecanicoService.obtener_estadisticas_mecanico(db, mecanico.id, mes)
                reporte.append(stats)
            except ValueError:
                continue
        
        return reporte
    
    @staticmethod
    def buscar_mecanicos(db: Session, termino: str, limit: int = 10) -> List[Mecanico]:
        """Buscar mecánicos por nombre o ID nacional"""
        return db.query(Mecanico).filter(
            and_(
                Mecanico.activo == True,
                func.or_(
                    Mecanico.nombre.ilike(f"%{termino}%"),
                    Mecanico.id_nacional.ilike(f"%{termino}%")
                )
            )
        ).limit(limit).all()
