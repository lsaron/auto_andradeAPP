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

def calcular_fechas_quincena(año: int, num_quincena: int) -> tuple[datetime, datetime]:
    """
    Calcula las fechas de inicio y fin de una quincena específica.
    Sistema de 4 semanas por mes mapeadas a 2 quincenas:
    - Semanas 1-2 = Q1 (días 1-15)
    - Semanas 3-4 = Q2 (días 16-31)
    """
    # Obtener el mes actual para calcular las fechas correctamente
    mes_actual = datetime.now().month
    
    if num_quincena in [1, 2]:
        # Primera quincena: días 1-15 del mes actual
        fecha_inicio = datetime(año, mes_actual, 1)
        fecha_fin = datetime(año, mes_actual, 15)
    elif num_quincena in [3, 4]:
        # Segunda quincena: días 16-31 del mes actual
        fecha_inicio = datetime(año, mes_actual, 16)
        # Obtener el último día del mes
        ultimo_dia = calendar.monthrange(año, mes_actual)[1]
        fecha_fin = datetime(año, mes_actual, ultimo_dia)
    else:
        raise ValueError(f"Número de quincena inválido: {num_quincena}. Debe ser 1, 2, 3 o 4.")
    
    return fecha_inicio, fecha_fin

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
            comisiones_denegadas = sum(float(c.monto_comision) for c in comisiones if c.estado_comision == EstadoComision.DENEGADA)
            
            resultado.append({
                "id": mecanico.id,
                "id_nacional": mecanico.id_nacional,
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
                "comisiones_pendientes": comisiones_pendientes,
                "comisiones_denegadas": comisiones_denegadas
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
        comisiones_denegadas = [c for c in trabajos_asignados if c.estado_comision == EstadoComision.DENEGADA]
        
        return {
            "id": mecanico.id,
            "id_nacional": mecanico.id_nacional,
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
                "comisiones_denegadas": len(comisiones_denegadas),
                "total_aprobadas": sum(float(c.monto_comision) for c in comisiones_aprobadas),
                "total_penalizadas": sum(float(c.monto_comision) for c in comisiones_penalizadas),
                "total_pendientes": sum(float(c.monto_comision) for c in comisiones_pendientes),
                "total_denegadas": sum(float(c.monto_comision) for c in comisiones_denegadas)
            }
        }

    def crear_mecanico(self, datos_mecanico: Dict[str, Any]) -> Dict[str, Any]:
        """Crea un nuevo mecánico"""
        nuevo_mecanico = Mecanico(
            id_nacional=datos_mecanico["id_nacional"],
            nombre=datos_mecanico["nombre"],
            telefono=datos_mecanico.get("telefono"),
            porcentaje_comision=datos_mecanico.get("porcentaje_comision", 2.00),
            fecha_contratacion=datos_mecanico.get("fecha_contratacion") if datos_mecanico.get("fecha_contratacion") else None
        )
        
        self.db.add(nuevo_mecanico)
        self.db.commit()
        self.db.refresh(nuevo_mecanico)
        
        return {
            "message": "Mecánico creado exitosamente",
            "id": nuevo_mecanico.id,
            "nombre": nuevo_mecanico.nombre,
            "id_nacional": nuevo_mecanico.id_nacional,
            "telefono": nuevo_mecanico.telefono,
            "porcentaje_comision": float(nuevo_mecanico.porcentaje_comision),
            "fecha_contratacion": nuevo_mecanico.fecha_contratacion.strftime("%Y-%m-%d") if nuevo_mecanico.fecha_contratacion else None
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

    def asignar_multiples_mecanicos_trabajo(self, trabajo_id: int, mecanicos_ids: List[int]) -> Dict[str, Any]:
        """Asigna múltiples mecánicos a un trabajo y calcula comisiones divididas correctamente"""
        print(f"🔍 SERVICIO: Asignando {len(mecanicos_ids)} mecánicos al trabajo {trabajo_id}")
        
        # Verificar que el trabajo existe
        trabajo = self.db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
        if not trabajo:
            return {"error": "Trabajo no encontrado"}
        
        # Verificar que todos los mecánicos existen
        mecanicos = []
        for mecanico_id in mecanicos_ids:
            mecanico = self.db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
            if not mecanico:
                return {"error": f"Mecánico {mecanico_id} no encontrado"}
            mecanicos.append(mecanico)
        
        # Calcular ganancia base del trabajo (mano de obra - gastos reales)
        from app.models.detalle_gastos import DetalleGasto
        gastos = self.db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == trabajo_id).all()
        total_gastos_reales = sum(
            (g.monto if isinstance(g.monto, Decimal) else Decimal(str(g.monto)))
            for g in gastos
        )
        
        mano_obra = trabajo.mano_obra if isinstance(trabajo.mano_obra, Decimal) else Decimal(str(trabajo.mano_obra or '0.00'))
        ganancia_base = mano_obra - total_gastos_reales
        
        # Calcular comisión total del trabajo (2% sobre ganancia base)
        comision_total_trabajo = ganancia_base * Decimal('0.02') if ganancia_base > 0 else Decimal('0.00')
        
        # Dividir comisión entre todos los mecánicos
        comision_por_mecanico = comision_total_trabajo / len(mecanicos_ids) if mecanicos_ids else Decimal('0.00')
        
        print(f"🔍 SERVICIO: Ganancia base: {ganancia_base}")
        print(f"🔍 SERVICIO: Comisión total del trabajo: {comision_total_trabajo}")
        print(f"🔍 SERVICIO: Comisión por mecánico: {comision_por_mecanico}")
        
        # Eliminar asignaciones existentes para este trabajo
        asignaciones_existentes = self.db.query(ComisionMecanico).filter(
            ComisionMecanico.id_trabajo == trabajo_id
        ).all()
        
        for asignacion in asignaciones_existentes:
            self.db.delete(asignacion)
        
        # Crear nuevas asignaciones para cada mecánico
        asignaciones_creadas = []
        for mecanico_id in mecanicos_ids:
            nueva_asignacion = ComisionMecanico(
                id_trabajo=trabajo_id,
                id_mecanico=mecanico_id,
                ganancia_trabajo=ganancia_base,  # Ganancia base del trabajo
                porcentaje_comision=Decimal('2.00'),
                monto_comision=comision_por_mecanico,  # Comisión dividida
                mes_reporte=trabajo.fecha.strftime("%Y-%m"),
                estado_comision=EstadoComision.PENDIENTE
            )
            
            self.db.add(nueva_asignacion)
            asignaciones_creadas.append({
                "id_mecanico": mecanico_id,
                "comision": float(comision_por_mecanico)
            })
        
        self.db.commit()
        
        return {
            "message": f"{len(mecanicos_ids)} mecánicos asignados exitosamente",
            "trabajo_id": trabajo_id,
            "ganancia_base": float(ganancia_base),
            "comision_total_trabajo": float(comision_total_trabajo),
            "comision_por_mecanico": float(comision_por_mecanico),
            "asignaciones": asignaciones_creadas
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
            
            # Calcular fechas de inicio y fin de la quincena usando la función auxiliar
            try:
                fecha_inicio, fecha_fin = calcular_fechas_quincena(año, num_quincena)
            except ValueError as e:
                print(f"Error en formato de quincena: {e}")
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
        print(f"🔍 DEBUG SERVICIO: Buscando mecánico {mecanico_id}")
        mecanico = db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
        if not mecanico:
            print(f"❌ DEBUG SERVICIO: Mecánico {mecanico_id} no encontrado")
            raise ValueError("Mecánico no encontrado")
        print(f"✅ DEBUG SERVICIO: Mecánico encontrado: {mecanico.nombre}")
        
        try:
            # ✅ CORRECTO: Usar la tabla ComisionMecanico que tiene los datos reales calculados
            
            # Obtener todas las comisiones del mecánico
            comisiones_mecanico = db.query(ComisionMecanico).filter(
                ComisionMecanico.id_mecanico == mecanico_id
            ).all()
            
            trabajos_completados = len(comisiones_mecanico)
            total_ganancias = Decimal('0.00')
            total_comisiones = Decimal('0.00')
            
            # Sumar ganancias y comisiones desde las comisiones ya calculadas
            for comision in comisiones_mecanico:
                # Usar los datos ya calculados en la tabla ComisionMecanico
                total_ganancias += comision.ganancia_trabajo
                total_comisiones += comision.monto_comision
            
            # Crear objeto con estadísticas calculadas en tiempo real
            mecanico_con_stats = MecanicoConEstadisticas(
                id=mecanico.id,
                id_nacional=mecanico.id_nacional,
                nombre=mecanico.nombre,
                telefono=mecanico.telefono,
                porcentaje_comision=mecanico.porcentaje_comision,
                fecha_contratacion=mecanico.fecha_contratacion.date() if mecanico.fecha_contratacion else None,
                activo=mecanico.activo,
                total_trabajos=trabajos_completados,
                total_ganancias=float(total_ganancias),
                comisiones_mes=float(total_comisiones)
            )
            
            return mecanico_con_stats
            
        except Exception as e:
            print(f"❌ ERROR en obtener_estadisticas_mecanico: {e}")
            # En caso de error, retornar estadísticas con valores por defecto
            return MecanicoConEstadisticas(
                id=mecanico.id,
                id_nacional=mecanico.id_nacional,
                nombre=mecanico.nombre,
                telefono=mecanico.telefono,
                porcentaje_comision=mecanico.porcentaje_comision,
                fecha_contratacion=mecanico.fecha_contratacion.date() if mecanico.fecha_contratacion else None,
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

    def verificar_comisiones_mecanico(self, mecanico_id: int) -> Dict[str, Any]:
        """
        Verifica todas las comisiones de un mecánico para debug
        """
        try:
            # Obtener todas las comisiones del mecánico
            comisiones = self.db.query(ComisionMecanico).filter(
                ComisionMecanico.id_mecanico == mecanico_id
            ).all()
            
            resultado = []
            for comision in comisiones:
                trabajo = self.db.query(Trabajo).filter(Trabajo.id == comision.id_trabajo).first()
                resultado.append({
                    "id": comision.id,
                    "id_trabajo": comision.id_trabajo,
                    "id_mecanico": comision.id_mecanico,
                    "monto_comision": float(comision.monto_comision),
                    "estado_comision": comision.estado_comision.value,
                    "quincena": comision.quincena,
                    "fecha_trabajo": trabajo.fecha.isoformat() if trabajo else None,
                    "descripcion_trabajo": trabajo.descripcion if trabajo else None
                })
            
            return {
                "total_comisiones": len(resultado),
                "comisiones": resultado
            }
            
        except Exception as e:
            return {"error": f"Error al verificar comisiones: {str(e)}"}

    def asignar_quincenas_comisiones_pendientes(self) -> Dict[str, Any]:
        """
        Asigna quincenas a todas las comisiones pendientes que no tienen quincena asignada
        """
        try:
            # Obtener todas las comisiones pendientes sin quincena
            comisiones_sin_quincena = self.db.query(ComisionMecanico).filter(
                ComisionMecanico.quincena.is_(None),
                ComisionMecanico.estado_comision == EstadoComision.PENDIENTE
            ).all()
            
            if not comisiones_sin_quincena:
                return {"message": "No hay comisiones pendientes sin quincena asignada"}
            
            comisiones_actualizadas = 0
            
            for comision in comisiones_sin_quincena:
                # Obtener la fecha del trabajo
                trabajo = self.db.query(Trabajo).filter(Trabajo.id == comision.id_trabajo).first()
                if trabajo:
                    # Calcular la quincena basándose en la fecha del trabajo
                    if trabajo.fecha.day <= 15:
                        quincena = f"{trabajo.fecha.year}-Q1"
                    else:
                        quincena = f"{trabajo.fecha.year}-Q2"
                    
                    comision.quincena = quincena
                    comisiones_actualizadas += 1
            
            self.db.commit()
            
            return {
                "message": f"Quincenas asignadas exitosamente",
                "comisiones_actualizadas": comisiones_actualizadas
            }
            
        except Exception as e:
            self.db.rollback()
            return {"error": f"Error al asignar quincenas: {str(e)}"}

    def aprobar_denegar_comisiones_quincena(self, mecanico_id: int, quincena: str, aprobar: bool) -> Dict[str, Any]:
        print(f"DEBUG: Función llamada con aprobar = {aprobar} (tipo: {type(aprobar)})")
        print(f"DEBUG: Mecánico ID = {mecanico_id}, Quincena = {quincena}")
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
            
            # Calcular fechas de inicio y fin de la quincena usando la función auxiliar
            try:
                fecha_inicio, fecha_fin = calcular_fechas_quincena(año, num_quincena)
            except ValueError as e:
                return {"error": f"Error en formato de quincena: {e}"}
            
            # Obtener todas las comisiones del mecánico para esa quincena
            # Primero buscar por quincena asignada, luego por fecha del trabajo
            comisiones = self.db.query(ComisionMecanico).filter(
                ComisionMecanico.id_mecanico == mecanico_id,
                ComisionMecanico.quincena == quincena
            ).all()
            
            print(f"DEBUG: Buscando comisiones para mecánico {mecanico_id}, quincena {quincena}")
            print(f"DEBUG: Comisiones encontradas por quincena: {len(comisiones)}")
            
            # Si no hay comisiones con quincena asignada, buscar por fecha del trabajo
            if not comisiones:
                print(f"DEBUG: No hay comisiones con quincena asignada, buscando por fecha del trabajo")
                comisiones = self.db.query(ComisionMecanico).join(
                    Trabajo, ComisionMecanico.id_trabajo == Trabajo.id
                ).filter(
                    ComisionMecanico.id_mecanico == mecanico_id,
                    Trabajo.fecha >= fecha_inicio,
                    Trabajo.fecha <= fecha_fin,
                    ComisionMecanico.estado_comision == EstadoComision.PENDIENTE
                ).all()
                
                print(f"DEBUG: Comisiones encontradas por fecha del trabajo: {len(comisiones)}")
                for c in comisiones:
                    print(f"DEBUG: Comisión ID {c.id}, Trabajo {c.id_trabajo}, Estado {c.estado_comision}, Quincena {c.quincena}")
            
            if not comisiones:
                return {"error": f"No hay comisiones para el mecánico {mecanico.nombre} en la quincena {quincena}"}
            
            total_comisiones = len(comisiones)
            monto_total = sum(float(c.monto_comision) for c in comisiones)
            
            print(f"DEBUG: Procesando {len(comisiones)} comisiones, aprobar = {aprobar}")
            
            if aprobar:
                print("DEBUG: Aprobando comisiones...")
                # Marcar todas las comisiones como aprobadas y asignar la quincena
                for comision in comisiones:
                    print(f"DEBUG: Aprobando comisión ID {comision.id}")
                    comision.estado_comision = EstadoComision.APROBADA
                    comision.quincena = quincena  # Asignar la quincena
                
                self.db.commit()
                print("DEBUG: Comisiones aprobadas y guardadas")
                
                return {
                    "message": f"Comisiones aprobadas exitosamente",
                    "mecanico": mecanico.nombre,
                    "quincena": quincena,
                    "total_comisiones": total_comisiones,
                    "monto_total": monto_total,
                    "accion": "APROBADA"
                }
            else:
                print("DEBUG: Denegando comisiones...")
                # Marcar comisiones como denegadas (monto = 0, estado = DENEGADA)
                for comision in comisiones:
                    print(f"DEBUG: Denegando comisión ID {comision.id}, monto actual: {comision.monto_comision}")
                    comision.monto_comision = Decimal('0.00')
                    comision.estado_comision = EstadoComision.DENEGADA
                    comision.quincena = quincena
                    print(f"DEBUG: Comisión ID {comision.id} denegada, nuevo monto: {comision.monto_comision}, nuevo estado: {comision.estado_comision}")
                
                self.db.commit()
                print("DEBUG: Comisiones denegadas y guardadas")
                
                return {
                    "message": f"Comisiones denegadas exitosamente (monto = 0, estado = DENEGADA)",
                    "mecanico": mecanico.nombre,
                    "quincena": quincena,
                    "total_comisiones": total_comisiones,
                    "monto_total": monto_total,
                    "accion": "DENEGADA"
                }
                
        except Exception as e:
            self.db.rollback()
            return {"error": f"Error al procesar comisiones: {str(e)}"}
