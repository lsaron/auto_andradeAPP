// Función para generar PDF de factura automotriz
export const generateInvoicePDF = async (selectedOrderForPrint: any, download: boolean = false) => {
  if (!selectedOrderForPrint) return
  
  try {
    console.log("📄 Generando PDF para:", selectedOrderForPrint.id)
    
         // Obtener información completa del vehículo y cliente
     let vehicleInfo = null
     let clientInfo = null
     
     try {
       // Obtener información del vehículo desde la API
       const vehicleResponse = await fetch(`http://localhost:8000/api/carros/historial/${selectedOrderForPrint.licensePlate}`)
       if (vehicleResponse.ok) {
         vehicleInfo = await vehicleResponse.json()
         console.log("🚗 Información del vehículo:", vehicleInfo)
         
         // Obtener información completa del cliente si tenemos su ID
         if (vehicleInfo?.dueno_actual?.id_cliente) {
           try {
             const clientResponse = await fetch(`http://localhost:8000/api/clientes/${vehicleInfo.dueno_actual.id_cliente}`)
             if (clientResponse.ok) {
               clientInfo = await clientResponse.json()
               console.log("👤 Información completa del cliente:", clientInfo)
             }
           } catch (error) {
             console.warn("⚠️ No se pudo obtener información completa del cliente:", error)
           }
         }
       }
     } catch (error) {
       console.warn("⚠️ No se pudo obtener información del vehículo:", error)
     }
    
    // Función para formatear moneda
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC'
      }).format(amount)
    }
    
    // Función para formatear fecha
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-CR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    // Crear contenido HTML para el PDF
    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                 <title>Auto Andrade - Orden ${selectedOrderForPrint.id}</title>
                 <style>
           @page { 
             margin: 15mm; 
             size: A4;
           }
           @media print {
             body { 
               font-family: 'Arial', sans-serif; 
               font-size: 11px; 
               line-height: 1.3; 
               color: #333; 
               margin: 0; 
               padding: 0;
               background: white;
             }
             .invoice-container {
               background: white;
               max-width: none;
               width: 100%;
               padding: 0;
               border-radius: 0;
               box-shadow: none;
               border: none;
             }
           }
           @media screen {
             body { 
               font-family: 'Arial', sans-serif; 
               font-size: 11px; 
               line-height: 1.3; 
               color: #333; 
               margin: 0; 
               padding: 20px;
               background: #f5f5f5;
               min-height: 100vh;
               display: flex;
               justify-content: center;
               align-items: flex-start;
             }
             .invoice-container {
               background: white;
               max-width: 800px;
               width: 100%;
               padding: 30px;
               border-radius: 8px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
               border: 1px solid #e5e7eb;
             }
           }
           .header { 
             display: flex; 
             align-items: center; 
             margin-bottom: 10px; 
             border-bottom: 2px solid #1e40af; 
             padding-bottom: 6px;
           }
           .logo { 
             width: 80px; 
             height: 80px; 
             margin-right: 15px;
             object-fit: contain;
           }
           .header-info { 
             flex: 1;
           }
           .company-name { 
             font-size: 20px; 
             font-weight: bold; 
             color: #1e40af; 
             margin: 0 0 3px 0;
           }
           .company-experience { 
             font-size: 11px; 
             color: #6b7280; 
             margin: 0 0 5px 0;
           }
           .invoice-title { 
             font-size: 16px; 
             font-weight: bold; 
             color: #1e40af; 
             text-transform: uppercase;
           }
           .info-section { 
             display: flex; 
             justify-content: space-between; 
             margin-bottom: 10px; 
             padding: 8px; 
             border-left: 3px solid #1e40af;
           }
           .info-column { 
             flex: 1; 
             margin-right: 15px;
           }
           .info-column:last-child { 
             margin-right: 0;
           }
           .section-title { 
             font-size: 12px; 
             font-weight: bold; 
             color: #1e40af; 
             margin-bottom: 8px; 
             text-transform: uppercase; 
             border-bottom: 1px solid #1e40af; 
             padding-bottom: 2px;
           }
           .info-row { 
             font-size: 10px; 
             margin: 3px 0;
           }
           .vehicle-section { 
             padding: 8px; 
             margin-bottom: 10px; 
             border-left: 3px solid #3b82f6;
           }
           .vehicle-grid { 
             display: grid; 
             grid-template-columns: 1fr 1fr; 
             gap: 10px;
           }
           .work-description { 
             padding: 8px; 
             margin-bottom: 10px; 
             border-left: 3px solid #f59e0b;
           }
           .work-title { 
             font-size: 12px; 
             font-weight: bold; 
             color: #92400e; 
             margin-bottom: 6px; 
             text-transform: uppercase; 
             border-bottom: 1px solid #f59e0b; 
             padding-bottom: 3px;
           }
           .work-text { 
             font-size: 10px; 
             color: #451a03; 
             line-height: 1.4; 
             margin: 0;
           }
           .services-table { 
             width: 100%; 
             border-collapse: collapse; 
             margin-bottom: 10px; 
             background: white; 
             border: 1px solid #e5e7eb;
           }
           .services-table th { 
             color: #1e40af; 
             padding: 8px 6px; 
             text-align: left; 
             font-size: 10px; 
             font-weight: bold; 
             text-transform: uppercase;
             border-bottom: 2px solid #1e40af;
           }
           .services-table td { 
             padding: 6px; 
             font-size: 10px; 
             border-bottom: 1px solid #e5e7eb;
           }

           .labor-row { 
             font-weight: bold; 
             border-bottom: 2px solid #1e40af !important;
           }
           .labor-row td { 
             color: #1e40af !important;
           }
           .summary-section { 
             padding: 8px; 
             border: 1px solid #e5e7eb; 
             margin-bottom: 10px;
           }
           .summary-title { 
             font-size: 14px; 
             font-weight: bold; 
             color: #1e40af; 
             margin-bottom: 8px; 
             text-align: center; 
             text-transform: uppercase;
           }
           .summary-row { 
             display: flex; 
             justify-content: space-between; 
             margin-bottom: 5px; 
             padding: 4px 0; 
             border-bottom: 1px solid #e5e7eb;
           }
           .summary-total { 
             font-size: 14px; 
             font-weight: bold; 
             color: #1e40af; 
             border-top: 2px solid #1e40af; 
             padding-top: 6px; 
             margin-top: 6px;
           }
           .footer { 
             text-align: center; 
             margin-top: 10px; 
             padding-top: 6px; 
             border-top: 1px solid #e5e7eb; 
             color: #6b7280; 
             font-size: 9px;
           }
           .currency { 
             font-weight: 500;
           }
         </style>
      </head>
            <body>
        <div class="invoice-container">
          <!-- ENCABEZADO CON LOGO Y DATOS DE LA EMPRESA -->
          <div class="header">
           <img src="/auto-andrade.png" alt="Auto Andrade Logo" class="logo" onerror="this.style.display='none'">
           <div class="header-info">
             <div class="company-name">AUTO ANDRADE</div>
             <div class="company-experience">Más de 20 años de experiencia en el sector automotriz</div>
             <div class="invoice-title">Factura</div>
           </div>
         </div>
        
        <!-- INFORMACIÓN DE LA FACTURA Y CLIENTE -->
        <div class="info-section">
                     <div class="info-column">
             <div class="section-title">Información de la Factura</div>
             <div class="info-row"><strong>Número de Orden:</strong> ${selectedOrderForPrint.id}</div>
             <div class="info-row"><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
             <div class="info-row"><strong>Fecha de Servicio:</strong> ${formatDate(selectedOrderForPrint.date)}</div>
           </div>
          <div class="info-column">
            <div class="section-title">Datos del Cliente</div>
            <div class="info-row"><strong>Nombre:</strong> ${clientInfo?.nombre || vehicleInfo?.dueno_actual?.nombre || selectedOrderForPrint.clientName || 'No especificado'}</div>
            <div class="info-row"><strong>Cédula:</strong> ${clientInfo?.id_nacional || vehicleInfo?.dueno_actual?.id_cliente || 'No especificado'}</div>
            <div class="info-row"><strong>Teléfono:</strong> ${clientInfo?.telefono || 'No especificado'}</div>
            <div class="info-row"><strong>Correo:</strong> ${clientInfo?.correo || 'No especificado'}</div>
          </div>
        </div>
        
        <!-- INFORMACIÓN DEL VEHÍCULO -->
        <div class="vehicle-section">
          <div class="section-title">Información del Vehículo</div>
                     <div class="vehicle-grid">
             <div>
               <div class="info-row"><strong>Matrícula/Placa:</strong> ${vehicleInfo?.matricula || selectedOrderForPrint.licensePlate || 'No especificado'}</div>
               <div class="info-row"><strong>Marca:</strong> ${vehicleInfo?.marca || 'No especificado'}</div>
             </div>
             <div>
               <div class="info-row"><strong>Año:</strong> ${vehicleInfo?.anio || 'No especificado'}</div>
               <div class="info-row"><strong>Modelo:</strong> ${vehicleInfo?.modelo || 'No especificado'}</div>
             </div>
           </div>
        </div>
        
        <!-- DESCRIPCIÓN DEL TRABAJO -->
        <div class="work-description">
          <div class="work-title">Descripción del Trabajo Realizado</div>
          <div class="work-text">${selectedOrderForPrint.description || 'No se especificó descripción del trabajo'}</div>
        </div>
        
                <!-- TABLA DE SERVICIOS Y REPUESTOS -->
        <div class="section-title" style="margin-bottom: 10px; color: #333;">Detalle Gastos</div>
        <table class="services-table">
          <thead>
            <tr>
              <th style="width: 70%; color: #333;">Descripción del Repuesto/Material</th>
              <th style="width: 30%; text-align: right; color: #333;">Total</th>
            </tr>
          </thead>
          <tbody>
                         ${selectedOrderForPrint.expenseDetails && selectedOrderForPrint.expenseDetails.length > 0 ? 
               selectedOrderForPrint.expenseDetails.map((expense: any) => {
                 const precioCliente = parseFloat(expense.amountCharged || expense.amount) || 0;
                 return `
                   <tr>
                     <td>${expense.item || 'Repuesto/Material'}</td>
                     <td style="text-align: right;" class="currency">${formatCurrency(precioCliente)}</td>
                   </tr>
                 `;
               }).join('') : 
               '<tr><td colspan="2" style="text-align: center; color: #6b7280; font-style: italic;">No se registraron repuestos o materiales específicos</td></tr>'
             }
            <tr class="labor-row">
              <td>SUBTOTAL</td>
              <td style="text-align: right;" class="currency">${formatCurrency(selectedOrderForPrint.expenseDetails ? 
                selectedOrderForPrint.expenseDetails.reduce((sum: number, expense: any) => {
                  const precioCliente = parseFloat(expense.amountCharged || expense.amount) || 0;
                  return sum + precioCliente;
                }, 0) : 0
              )}</td>
            </tr>
          </tbody>
        </table>
        
                <!-- RESUMEN DE COSTOS -->
        <div class="summary-section">
          <div class="summary-row">
            <span>Mano de Obra:</span>
            <span class="currency">${formatCurrency(selectedOrderForPrint.manoObra || 0)}</span>
          </div>
          <div class="summary-row summary-total">
            <span>TOTAL A PAGAR:</span>
            <span class="currency">${formatCurrency(
              (parseFloat(selectedOrderForPrint.manoObra) || 0) + 
              (selectedOrderForPrint.expenseDetails ? 
                selectedOrderForPrint.expenseDetails.reduce((sum: number, expense: any) => {
                  const precioCliente = parseFloat(expense.amountCharged || expense.amount) || 0;
                  return sum + precioCliente;
                }, 0) : 0)
            )}</span>
          </div>
        </div>
        
                         <!-- AGRADECIMIENTO -->
        <div style="text-align: center; margin: 8px 0;">
          <p style="font-size: 11px; color: #6b7280; margin: 0;">¡Gracias por preferirnos!</p>
        </div>
        
          <!-- PIE DE PÁGINA -->
          <div class="footer">
            <p>© 2025 - Auto Andrade</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    if (download) {
      // Crear y descargar el PDF
      const blob = new Blob([invoiceHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Auto_Andrade_Orden_${selectedOrderForPrint.id}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      // Crear ventana temporal para el PDF
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(invoiceHTML)
        printWindow.document.close()
        
        // Esperar a que se cargue el contenido y luego imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 1000)
        }
      }
    }
    
  } catch (error) {
    console.error("Error al generar PDF:", error)
    alert("Error al generar PDF. Inténtalo de nuevo.")
  }
}
