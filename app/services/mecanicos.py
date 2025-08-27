from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime, timezone
from app.models.mecanicos import Mecanico
from app.models.trabajos_mecanicos import TrabajoMecanico
from app.models.comisiones_mecanicos import ComisionMecanico, EstadoComision
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from app.schemas.mecanicos import MecanicoCreate, MecanicoUpdate, MecanicoConEstadisticas
import calendar

class MecanicoService:
    
    def __init__(self, db: Session):
        self.db = db

    def obtener_todos_los_mecanicos(self) -> List[Dict[str, Any]]:
        """Obtiene todos los mecánicos con información básica"""
        mecanicos = self.db.query(Mecanico).all()
        resultado = []
        
        for mecanico in mecanicos:
            # Calcular comisiones totales del mecánico
            comisiones = self.db.query(ComisionMecanico).filter(
                ComisionMecanico.id_mecanico == mecanico.id
            ).all()
            
            total_comisiones = sum(float(c.monto_comision) for c in comisiones)
            
            # Calcular comisiones por estado
            comisiones_aprobadas = sum(float(c.monto_comision) for c in comisiones if c.estado_comision == EstadoComision.APROBADA)
            comisiones_penalizadas = sum(float(c.monto_comision) for c in comisiones if c.estado_comision == EstadoComision.PENALIZADA)
            comisiones_pendientes = sum(float(c.monto_comision) for c in comisiones if c.estado_comision == EstadoComision.PENDIENTE)
            
            resultado.append({
                "id": mecanico.id,
                "nombre": mecanico.nombre,
                "telefono": mecanico.telefono,
                "porcentaje_comision": float(mecanico.porcentaje_comision),
                "fecha_contratacion": mecanico.fecha_contratacion.strftime("%Y-%m-%d") if mecanico.fecha_contratacion else None,
                "activo": mecanico.activo,
                "created_at": mecanico.created_at.isoformat() if mecanico.created_at else None,
                "updated_at": mecanico.updated_at.isoformat() if mecanico.updated_at else None,
                "total_comisiones": total_comisiones,
                "comisiones_aprobadas": comisiones_aprobadas,
                "comisiones_penalizadas": comisiones_penalizadas,
                "comisiones_pendientes": comisiones_pendientes
            })
        
        return resultado

    def obtener_mecanico_por_id(self, mecanico_id: int) -> Dict[str, Any]:
        """Obtiene un mecánico específico con información detallada"""
        mecanico = self.db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not mecanico:
            return None
        
        # Obtener trabajos asignados
        trabajos_asignados = self.db.query(ComisionMecanico).filter(
            ComisionMecanico.id_mecanico == mecanico_id
        ).all()
        
        # Obtener comisiones por estado
        comisiones_aprobadas = [c for c in trabajos_asignados if c.estado_comision == EstadoComision.APROBADA]
        comisiones_penalizadas = [c for c in trabajos_asignados if c.estado_comision == EstadoComision.PENALIZADA]
        comisiones_pendientes = [c for c in trabajos_asignados if c.estado_comision == EstadoComision.PENDIENTE]
        
        return {
            "id": mecanico.id,
            "nombre": mecanico.nombre,
            "telefono": mecanico.telefono,
            "porcentaje_comision": float(mecanico.porcentaje_comision),
            "fecha_contratacion": mecanico.fecha_contratacion.strftime("%Y-%m-%d") if mecanico.fecha_contratacion else None,
            "activo": mecanico.activo,
            "created_at": mecanico.created_at.isoformat() if mecanico.created_at else None,
            "updated_at": mecanico.updated_at.isoformat() if mecanico.updated_at else None,
            "resumen_comisiones": {
                "total_trabajos": len(trabajos_asignados),
                "comisiones_aprobadas": len(comisiones_aprobadas),
                "comisiones_penalizadas": len(comisiones_penalizadas),
                "comisiones_pendientes": len(comisiones_pendientes),
                "total_aprobadas": sum(float(c.monto_comision) for c in comisiones_aprobadas),
                "total_penalizadas": sum(float(c.monto_comision) for c in comisiones_penalizadas),
                "total_pendientes": sum(float(c.monto_comision) for c in comisiones_pendientes)
            }
        }

    def crear_mecanico(self, datos_mecanico: Dict[str, Any]) -> Dict[str, Any]:
        """Crea un nuevo mecánico"""
        nuevo_mecanico = Mecanico(
            nombre=datos_mecanico["nombre"],
            telefono=datos_mecanico.get("telefono"),
            fecha_contratacion=datetime.strptime(datos_mecanico["fecha_contratacion"], "%Y-%m-%d") if datos_mecanico.get("fecha_contratacion") else None
        )
        
        self.db.add(nuevo_mecanico)
        self.db.commit()
        self.db.refresh(nuevo_mecanico)
        
        return {
            "message": "Mecánico creado exitosamente",
            "id": nuevo_mecanico.id,
            "nombre": nuevo_mecanico.nombre
        }

    def actualizar_mecanico(self, mecanico_id: int, datos_actualizacion: Dict[str, Any]) -> Dict[str, Any]:
        """Actualiza un mecánico existente"""
        mecanico = self.db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not mecanico:
            return {"error": "Mecánico no encontrado"}
        
        # Actualizar campos
        if "nombre" in datos_actualizacion:
            mecanico.nombre = datos_actualizacion["nombre"]
        if "telefono" in datos_actualizacion:
            mecanico.telefono = datos_actualizacion["telefono"]
        if "fecha_contratacion" in datos_actualizacion and datos_actualizacion["fecha_contratacion"]:
            mecanico.fecha_contratacion = datetime.strptime(datos_actualizacion["fecha_contratacion"], "%Y-%m-%d")
        
        self.db.commit()
        
        return {
            "message": "Mecánico actualizado exitosamente",
            "id": mecanico.id,
            "nombre": mecanico.nombre
        }

    def eliminar_mecanico(self, mecanico_id: int) -> Dict[str, Any]:
        """Elimina un mecánico (solo si no tiene comisiones asociadas)"""
        mecanico = self.db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not mecanico:
            return {"error": "Mecánico no encontrado"}
        
        # Verificar si tiene comisiones
        comisiones = self.db.query(ComisionMecanico).filter(
            ComisionMecanico.id_mecanico == mecanico_id
        ).first()
        
        if comisiones:
            return {"error": "No se puede eliminar el mecánico porque tiene comisiones asociadas"}
        
        self.db.delete(mecanico)
        self.db.commit()
        
        return {"message": "Mecánico eliminado exitosamente"}

    def calcular_comision_trabajo(self, trabajo_id: int, mecanico_id: int) -> Decimal:
        """Calcula la comisión para un mecánico en un trabajo específico"""
        trabajo = self.db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
        if not trabajo:
            return Decimal('0.00')
        
        # Obtener gastos reales del trabajo
        from app.models.detalle_gastos import DetalleGasto
        gastos = self.db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == trabajo_id).all()
        total_gastos_reales = sum(
            (g.monto if isinstance(g.monto, Decimal) else Decimal(str(g.monto)))
            for g in gastos
        )
        
        # Calcular ganancia base para comisiones (mano de obra - gastos reales)
        mano_obra = trabajo.mano_obra if isinstance(trabajo.mano_obra, Decimal) else Decimal(str(trabajo.mano_obra or '0.00'))
        ganancia_base = mano_obra - total_gastos_reales
        
        # Comisión del 2% sobre la ganancia base
        comision = ganancia_base * Decimal('0.02')
        return max(comision, Decimal('0.00'))  # No permitir comisiones negativas

    def asignar_mecanico_trabajo(self, trabajo_id: int, mecanico_id: int) -> Dict[str, Any]:
        """Asigna un mecánico a un trabajo y calcula su comisión"""
        # Verificar que el trabajo y mecánico existan
        trabajo = self.db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
        mecanico = self.db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        
        if not trabajo:
            return {"error": "Trabajo no encontrado"}
        if not mecanico:
            return {"error": "Mecánico no encontrado"}
        
        # Verificar si ya existe la asignación
        asignacion_existente = self.db.query(ComisionMecanico).filter(
            ComisionMecanico.id_trabajo == trabajo_id,
            ComisionMecanico.id_mecanico == mecanico_id
        ).first()
        
        if asignacion_existente:
            return {"error": "El mecánico ya está asignado a este trabajo"}
        
        # Calcular comisión
        comision = self.calcular_comision_trabajo(trabajo_id, mecanico_id)
        
        # Crear nueva asignación
        nueva_asignacion = ComisionMecanico(
            id_trabajo=trabajo_id,
            id_mecanico=mecanico_id,
            ganancia_trabajo=comision,
            porcentaje_comision=Decimal('2.00'),
            monto_comision=comision,
            mes_reporte=trabajo.fecha.strftime("%Y-%m"),
            estado_comision=EstadoComision.PENDIENTE
        )
        
        self.db.add(nueva_asignacion)
        self.db.commit()
        
        return {
            "message": "Mecánico asignado exitosamente",
            "id_asignacion": nueva_asignacion.id,
            "comision_calculada": float(comision)
        }

    def actualizar_comisiones_trabajo(self, trabajo_id: int, mecanicos_ids: List[int]) -> Dict[str, Any]:
        """Actualiza las comisiones de un trabajo basándose en los mecánicos asignados"""
        # Obtener comisiones existentes para este trabajo
        comisiones_existentes = self.db.query(ComisionMecanico).filter(
            ComisionMecanico.id_trabajo == trabajo_id
        ).all()
        
        # Crear conjunto de IDs de mecánicos existentes
        mecanicos_existentes = {c.id_mecanico for c in comisiones_existentes}
        mecanicos_nuevos = set(mecanicos_ids)
        
        # Mecánicos a eliminar (ya no están asignados)
        mecanicos_a_eliminar = mecanicos_existentes - mecanicos_nuevos
        
        # Mecánicos nuevos a agregar
        mecanicos_a_agregar = mecanicos_nuevos - mecanicos_existentes
        
        # Eliminar comisiones de mecánicos no asignados
        for mecanico_id in mecanicos_a_eliminar:
            comision = self.db.query(ComisionMecanico).filter(
                ComisionMecanico.id_trabajo == trabajo_id,
                ComisionMecanico.id_mecanico == mecanico_id
            ).first()
            if comision:
                self.db.delete(comision)
        
        # Agregar comisiones para nuevos mecánicos
        for mecanico_id in mecanicos_a_agregar:
            comision = self.calcular_comision_trabajo(trabajo_id, mecanico_id)
            nueva_comision = ComisionMecanico(
                id_trabajo=trabajo_id,
                id_mecanico=mecanico_id,
                ganancia_trabajo=comision,
                porcentaje_comision=Decimal('2.00'),
                monto_comision=comision,
                mes_reporte=datetime.now().strftime("%Y-%m"),
                estado_comision=EstadoComision.PENDIENTE
            )
            self.db.add(nueva_comision)
        
        self.db.commit()
        
        return {
            "message": "Comisiones actualizadas exitosamente",
            "mecanicos_eliminados": len(mecanicos_a_eliminar),
            "mecanicos_agregados": len(mecanicos_a_agregar)
        }

    def obtener_comisiones_mecanico(self, mecanico_id: int, estado: str = None) -> List[Dict[str, Any]]:
        """Obtiene las comisiones de un mecánico específico, opcionalmente filtradas por estado"""
        query = self.db.query(ComisionMecanico).filter(ComisionMecanico.id_mecanico == mecanico_id)
        
        if estado:
            query = query.filter(ComisionMecanico.estado_comision == EstadoComision(estado))
        
        comisiones = query.all()
        
        resultado = []
        for comision in comisiones:
            # Obtener información del trabajo
            trabajo = self.db.query(Trabajo).filter(Trabajo.id == comision.id_trabajo).first()
            
            resultado.append({
                "id": comision.id,
                "id_trabajo": comision.id_trabajo,
                "descripcion_trabajo": trabajo.descripcion if trabajo else "Trabajo no encontrado",
                "fecha_trabajo": trabajo.fecha.strftime("%Y-%m-%d") if trabajo else None,
                "monto_comision": float(comision.monto_comision),
                "estado_comision": comision.estado_comision.value,
                "fecha_calculo": comision.fecha_calculo.strftime("%Y-%m-%d %H:%M:%S"),
                "quincena": comision.quincena
            })
        
        return resultado

    def cambiar_estado_comision(self, comision_id: int, nuevo_estado: str) -> Dict[str, Any]:
        """Cambia el estado de una comisión específica"""
        comision = self.db.query(ComisionMecanico).filter(ComisionMecanico.id == comision_id).first()
        if not comision:
            return {"error": "Comisión no encontrada"}
        
        if nuevo_estado not in ["APROBADA", "PENALIZADA"]:
            return {"error": "Estado inválido. Use: APROBADA o PENALIZADA"}
        
        comision.estado_comision = EstadoComision(nuevo_estado)
        self.db.commit()
        
        return {
            "message": f"Estado de comisión cambiado a {nuevo_estado}",
            "id_comision": comision.id,
            "nuevo_estado": nuevo_estado
        }

    def obtener_resumen_comisiones_quincena(self, quincena: str) -> Dict[str, Any]:
        """Obtiene un resumen de comisiones para una quincena específica"""
        comisiones = self.db.query(ComisionMecanico).filter(
            ComisionMecanico.quincena == quincena
        ).all()
        
        # Agrupar por estado
        comisiones_aprobadas = [c for c in comisiones if c.estado_comision == EstadoComision.APROBADA]
        comisiones_penalizadas = [c for c in comisiones if c.estado_comision == EstadoComision.PENALIZADA]
        comisiones_pendientes = [c for c in comisiones if c.estado_comision == EstadoComision.PENDIENTE]
        
        # Calcular totales
        total_aprobadas = sum(float(c.monto_comision) for c in comisiones_aprobadas)
        total_penalizadas = sum(float(c.monto_comision) for c in comisiones_penalizadas)
        total_pendientes = sum(float(c.monto_comision) for c in comisiones_pendientes)
        
        return {
            "quincena": quincena,
            "resumen": {
                "total_comisiones": len(comisiones),
                "comisiones_aprobadas": len(comisiones_aprobadas),
                "comisiones_penalizadas": len(comisiones_penalizadas),
                "comisiones_pendientes": len(comisiones_pendientes),
                "total_aprobadas": total_aprobadas,
                "total_penalizadas": total_penalizadas,
                "total_pendientes": total_pendientes
            }
        }
    
    def obtener_comisiones_quincena_mecanico(self, mecanico_id: int, quincena: str) -> List[Dict[str, Any]]:
        """Obtiene las comisiones de un mecánico para una quincena específica"""
        try:
            # Extraer año y número de quincena del parámetro quincena (formato: YYYY-Q1, YYYY-Q2, etc.)
            año, num_quincena = quincena.split('-')
            año = int(año)
            num_quincena = int(num_quincena.replace('Q', ''))
            
            # Calcular fechas de inicio y fin de la quincena
            if num_quincena == 1:
                fecha_inicio = datetime(año, 1, 1)
                fecha_fin = datetime(año, 12, 15)
            elif num_quincena == 2:
                fecha_inicio = datetime(año, 1, 16)
                fecha_fin = datetime(año, 12, 31)
            else:
                return []
            
            # Buscar comisiones por fecha del trabajo dentro del rango de la quincena
            comisiones = self.db.query(ComisionMecanico).join(
                Trabajo, ComisionMecanico.id_trabajo == Trabajo.id
            ).filter(
                ComisionMecanico.id_mecanico == mecanico_id,
                Trabajo.fecha >= fecha_inicio,
                Trabajo.fecha <= fecha_fin
            ).all()
            
            resultado = []
            for comision in comisiones:
                # Obtener información del trabajo
                trabajo = self.db.query(Trabajo).filter(Trabajo.id == comision.id_trabajo).first()
                
                resultado.append({
                    "id": comision.id,
                    "id_trabajo": comision.id_trabajo,
                    "descripcion_trabajo": trabajo.descripcion if trabajo else "Trabajo no encontrado",
                    "fecha_trabajo": trabajo.fecha.strftime("%Y-%m-%d") if trabajo else None,
                    "monto_comision": float(comision.monto_comision),
                    "estado_comision": comision.estado_comision.value,
                    "fecha_calculo": comision.fecha_calculo.strftime("%Y-%m-%d %H:%M:%S") if comision.fecha_calculo else None,
                    "quincena": comision.quincena,
                    "porcentaje_comision": float(comision.porcentaje_comision) if comision.porcentaje_comision else 2.0
                })
            
            return resultado
            
        except Exception as e:
            print(f"Error al obtener comisiones por quincena: {e}")
            return []

    @staticmethod
    def obtener_estadisticas_mecanico(db: Session, mecanico_id: int, mes: Optional[str] = None) -> MecanicoConEstadisticas:
        """Obtener estadísticas de un mecánico (trabajos, ganancias, comisiones)"""
        mecanico = db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not mecanico:
            raise ValueError("Mecánico no encontrado")
        
        try:
            # ✅ CORRECTO: Calcular estadísticas en tiempo real en lugar de usar tabla ComisionMecanico
            
            # Obtener todos los trabajos asignados al mecánico
            trabajos_mecanico = db.query(TrabajoMecanico).filter(
                TrabajoMecanico.id_mecanico == mecanico_id
            ).all()
            
            trabajos_completados = len(trabajos_mecanico)
            total_ganancias = Decimal('0.00')
            total_comisiones = Decimal('0.00')
            
            # Calcular ganancias y comisiones para cada trabajo
            for trabajo_mecanico in trabajos_mecanico:
                trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_mecanico.id_trabajo).first()
                if trabajo:
                    # Calcular gastos reales del trabajo
                    gastos_reales = db.query(func.sum(DetalleGasto.monto)).filter(
                        DetalleGasto.id_trabajo == trabajo.id
                    ).scalar() or Decimal('0.00')
                    
                    # ✅ CORRECTO: Ganancia base = Mano de Obra - Gastos Reales
                    mano_obra = Decimal(str(trabajo.mano_obra or 0))
                    gastos_reales_decimal = Decimal(str(gastos_reales))
                    ganancia_base = mano_obra - gastos_reales_decimal
                    
                    # ✅ CORRECTO: Comisión = 2% sobre la ganancia base, dividida entre todos los mecánicos del trabajo
                    # Primero calcular cuántos mecánicos están asignados a este trabajo
                    total_mecanicos_trabajo = db.query(TrabajoMecanico).filter(
                        TrabajoMecanico.id_trabajo == trabajo.id
                    ).count()
                    
                    # Calcular comisión total y dividirla entre los mecánicos
                    comision_total = ganancia_base * Decimal('0.02') if ganancia_base > 0 else Decimal('0.00')
                    comision_individual = comision_total / total_mecanicos_trabajo if total_mecanicos_trabajo > 0 else Decimal('0.00')
                    
                    total_ganancias += ganancia_base
                    total_comisiones += comision_individual  # Sumar la comisión individual, no la total
            
            # Crear objeto con estadísticas calculadas en tiempo real
            mecanico_con_stats = MecanicoConEstadisticas(
                id=mecanico.id,
                nombre=mecanico.nombre,
                telefono=mecanico.telefono,
                porcentaje_comision=mecanico.porcentaje_comision,
                fecha_contratacion=mecanico.fecha_contratacion,
                activo=mecanico.activo,
                total_trabajos=trabajos_completados,
                total_ganancias=float(total_ganancias),
                comisiones_mes=float(total_comisiones)
            )
            
            return mecanico_con_stats
            
        except Exception as e:
            # En caso de error, retornar estadísticas con valores por defecto
            return MecanicoConEstadisticas(
                id=mecanico.id,
                nombre=mecanico.nombre,
                telefono=mecanico.telefono,
                porcentaje_comision=mecanico.porcentaje_comision,
                fecha_contratacion=mecanico.fecha_contratacion,
                activo=mecanico.activo,
                total_trabajos=0,
                total_ganancias=0.0,
                comisiones_mes=0.0
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

    def aprobar_denegar_comisiones_quincena(self, mecanico_id: int, quincena: str, aprobar: bool) -> Dict[str, Any]:
        """
        Aprueba o deniega todas las comisiones de un mecánico para una quincena específica.
        Si se deniegan, se eliminan todas las comisiones de la base de datos.
        """
        try:
            # Verificar que el mecánico existe
            mecanico = self.db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
            if not mecanico:
                return {"error": "Mecánico no encontrado"}
            
            # Extraer año y número de quincena del parámetro quincena (formato: YYYY-Q1, YYYY-Q2, etc.)
            try:
                año, num_quincena = quincena.split('-')
                año = int(año)
                num_quincena = int(num_quincena.replace('Q', ''))
            except ValueError:
                return {"error": f"Formato de quincena inválido: {quincena}. Debe ser YYYY-Q1, YYYY-Q2, etc."}
            
            # Calcular fechas de inicio y fin de la quincena
            if num_quincena == 1:
                fecha_inicio = datetime(año, 1, 1)
                fecha_fin = datetime(año, 12, 15)
            elif num_quincena == 2:
                fecha_inicio = datetime(año, 1, 16)
                fecha_fin = datetime(año, 12, 31)
            else:
                return {"error": f"Número de quincena inválido: {num_quincena}. Debe ser 1 o 2."}
            
            # Obtener todas las comisiones del mecánico para esa quincena
            # Buscar por fecha del trabajo dentro del rango de la quincena
            comisiones = self.db.query(ComisionMecanico).join(
                Trabajo, ComisionMecanico.id_trabajo == Trabajo.id
            ).filter(
                ComisionMecanico.id_mecanico == mecanico_id,
                Trabajo.fecha >= fecha_inicio,
                Trabajo.fecha <= fecha_fin
            ).all()
            
            if not comisiones:
                return {"error": f"No hay comisiones para el mecánico {mecanico.nombre} en la quincena {quincena}"}
            
            total_comisiones = len(comisiones)
            monto_total = sum(float(c.monto_comision) for c in comisiones)
            
            if aprobar:
                # Marcar todas las comisiones como aprobadas y asignar la quincena
                for comision in comisiones:
                    comision.estado_comision = EstadoComision.APROBADA
                    comision.quincena = quincena  # Asignar la quincena
                
                self.db.commit()
                
                return {
                    "message": f"Comisiones aprobadas exitosamente",
                    "mecanico": mecanico.nombre,
                    "quincena": quincena,
                    "total_comisiones": total_comisiones,
                    "monto_total": monto_total,
                    "accion": "APROBADA"
                }
            else:
                # Eliminar todas las comisiones de la base de datos
                for comision in comisiones:
                    self.db.delete(comision)
                
                self.db.commit()
                
                return {
                    "message": f"Comisiones denegadas y eliminadas exitosamente",
                    "mecanico": mecanico.nombre,
                    "quincena": quincena,
                    "total_comisiones": total_comisiones,
                    "monto_total": monto_total,
                    "accion": "DENEGADA"
                }
                
        except Exception as e:
            self.db.rollback()
            return {"error": f"Error al procesar comisiones: {str(e)}"}
