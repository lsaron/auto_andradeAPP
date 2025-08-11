from jinja2 import Template

def generar_html_factura(datos_factura: dict) -> str:
    plantilla_html = """
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totales { margin-top: 30px; }
            .totales td { font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Factura Auto Andrade</h1>
        <p><strong>Cliente:</strong> {{ cliente.nombre }} ({{ cliente.id_nacional }})</p>
        <p><strong>Carro:</strong> {{ carro.marca }} {{ carro.modelo }} - Matrícula {{ carro.matricula }}</p>
        <p><strong>Fecha:</strong> {{ trabajo.fecha }}</p>
        <p><strong>Descripción del trabajo:</strong> {{ trabajo.descripcion }}</p>

        <h2>Detalle de gastos</h2>
        <table>
            <tr><th>Descripción</th><th>Monto</th></tr>
            {% for gasto in trabajo.detalle_gastos %}
            <tr><td>{{ gasto.descripcion }}</td><td>₡ {{ '{:,.2f}'.format(gasto.monto) }}</td></tr>
            {% endfor %}
        </table>

        <table class="totales">
            <tr><td>Subtotal:</td><td>₡ {{ '{:,.2f}'.format(trabajo.costo) }}</td></tr>
            <tr><td>IVA:</td><td>₡ {{ '{:,.2f}'.format(iva) }}</td></tr>
            <tr><td>Total:</td><td>₡ {{ '{:,.2f}'.format(total) }}</td></tr>
        </table>
    </body>
    </html>
    """

    template = Template(plantilla_html)
    return template.render(**datos_factura)
