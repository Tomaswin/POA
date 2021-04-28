# POA

Trabajo práctico para la materia `Programación con objetos avanzada` de la Facultad de Ingeniería de la Universidad de Palermo. _[ Primer cuatrimestre - 2021 ]_

<br>

Integrantes: 
- Tomas Winiki
- Natalia Bellosi

<br>


# **Sistema de gestion de premios por fidelidad**
Requerimientos: 
- El usuario deberá autenticar su identidad para ingresar al sistema.
- El usuario podrá seleccionar de un listado de productos uno, o más, que desee canjear por un monto de puntos.
- El sistema validará si los puntos acumulados por el usuario son suficientes para realizar el canje deseado.
- El usuario administrador podrá crear, editar y eliminar productos del sistema. 

<br>


# Modelo de Datos
[img1]: documents/datamodel.png

# Diagrama de Clases
[img1]: documents/diagramclass.png

# Esquema GraphQL
[img1]: documents/schema.png 

# Tecnologías

### **NodeJs** 
_[ entorno JavaScript ]_
<br>

Lo utilizamos por su facilidad a la hora de crear nuevos endpoints, sentimos que no necesitamos una herramienta mucho más poderosa que node para lograr los endpoints
que estamos necesitando. Firebase se va a encargar de hacer todo el trabajo pesado a la hora de traer la información.

<br>

### **GraphQL** 
_[ interfaz ]_
<br>

se requieren pocas entidades por lo q no es tan tedioso la configuracion de esquema de datos en graphQL 

<br>

### **Firebase** 
_[ base de datos ]_
<br>

Utilizamos firebase porque tiene una facilidad a la hora de autenticar usuarios si bien vamos a tener que luego unir la información de la sesión con alguna tabla
los métodos que usa son simples y suficientes para este proyecto. Además al hacer uso de documentos como su método de base de datos nos facilita a la hora de crear sistemas de historial como es el caso de "historial de canjes".
