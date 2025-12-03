<?php

namespace JEvans\Controller;

use Zend\Mvc\Controller\AbstractActionController;
use Zend\View\Model\ViewModel;
use Zend\Mail\Message;
use Zend\Mime;
use Zend\Mail\Transport\Sendmail as MailTransport;
use Zend\Mail\Transport\Smtp as SmtpTransport;
use Zend\Mail\Transport\SmtpOptions;

class CanalIntegridadController extends AbstractActionController
{
    protected $mailTo = 'jcordova@jevansa.com.pe';

    public function indexAction()
    {
        $error = "";
        $success = "";
        $FechaGeneracion = date("d/m/Y H:i:s");

        if ($_SERVER["REQUEST_METHOD"] === "POST") {

            $userType = trim(isset($_POST["userType"]) ? $_POST["userType"] : '');
            $nombreCompleto = trim(isset($_POST["nombreCompleto"]) ? $_POST["nombreCompleto"] : '');
            $correoContacto = trim(isset($_POST["correoContacto"]) ? $_POST["correoContacto"] : '');
            $telefonoContacto = trim(isset($_POST["telefonoContacto"]) ? $_POST["telefonoContacto"] : '');
            $descripcionHallazgo = trim(isset($_POST["descripcionHallazgo"]) ? $_POST["descripcionHallazgo"] : '');

            if (!empty($userType) && !empty($descripcionHallazgo)) {

                $link = mysqli_connect('localhost', 'jevansa_jevans', 'RpMN6@we2', 'jevansa_jevans');

                if (!$link) {
                    $error = "Error de conexión: " . mysqli_connect_error();
                } else {
                    $sql = "INSERT INTO canal_integridad 
                            (user_type, nombre_completo, correo_contacto, telefono_contacto, descripcion_hallazgo)
                            VALUES (?, ?, ?, ?, ?)";

                    $stmt = mysqli_prepare($link, $sql);

                    if ($stmt) {
                        mysqli_stmt_bind_param(
                            $stmt,
                            "sssss",
                            $userType,
                            $nombreCompleto,
                            $correoContacto,
                            $telefonoContacto,
                            $descripcionHallazgo
                        );

                        $result = mysqli_stmt_execute($stmt);

                        if ($result) {
                            $insertId = mysqli_insert_id($link);

                            $subject = "[Canal de Integridad] Nuevo Registro #" . str_pad($insertId, 6, "0", STR_PAD_LEFT);

                            $html = '<table width="500" style="margin:0 auto;" cellpadding="6">
    <tr><td colspan="2" style="font-size:18px;color:#333;font-family:Arial;">Nuevo reporte recibido</td></tr>
    <tr><td><b>Usted es:</b></td><td>' . htmlspecialchars($userType, ENT_QUOTES, 'UTF-8') . '</td></tr>' .
    (!empty($nombreCompleto) ? '<tr><td><b>Nombre Completo:</b></td><td>' . htmlspecialchars($nombreCompleto, ENT_QUOTES, 'UTF-8') . '</td></tr>' : '') .
    (!empty($correoContacto) ? '<tr><td><b>Correo:</b></td><td>' . htmlspecialchars($correoContacto, ENT_QUOTES, 'UTF-8') . '</td></tr>' : '') .
    (!empty($telefonoContacto) ? '<tr><td><b>Teléfono:</b></td><td>' . htmlspecialchars($telefonoContacto, ENT_QUOTES, 'UTF-8') . '</td></tr>' : '') .
    '<tr><td><b>Descripción del Hallazgo:</b></td><td>' . nl2br(htmlspecialchars($descripcionHallazgo, ENT_QUOTES, 'UTF-8')) . '</td></tr>
    <tr><td><b>Número de Registro:</b></td><td>#' . str_pad($insertId, 6, "0", STR_PAD_LEFT) . '</td></tr>
    <tr><td><b>Fecha:</b></td><td>' . $FechaGeneracion . '</td></tr>
    <tr><td colspan="2" style="font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:10px;">&copy; J Evans. Todos los derechos reservados.</td></tr>
</table>';

                            // --- Send emails via API (asynchronously) ---
                            $apiUrl = 'https://jadmin-nu.vercel.app/api/email-smtp';
                            
                            // Email 1: Send to admin
                            $emailDataAdmin = [
                                'to' => $this->mailTo,
                                'subject' => $subject,
                                'html' => $html,
                                'from' => 'soporteit@jevansa.com.pe'
                            ];
                            
                            // Email 2: Send to user (if email provided)
                            if (!empty($correoContacto)) {
                                $emailDataUser = [
                                    'to' => $correoContacto,
                                    'subject' => $subject,
                                    'html' => $html,
                                    'from' => 'soporteit@jevansa.com.pe'
                                ];
                                $this->sendEmailAsync($apiUrl, $emailDataUser);
                            }
                            
                            // Send admin email
                            $this->sendEmailAsync($apiUrl, $emailDataAdmin);

                            $success = "Mensaje enviado correctamente. Ticket #" . str_pad($insertId, 6, "0", STR_PAD_LEFT);
                        } else {
                            $error = "Error al guardar en base de datos: " . mysqli_error($link);
                        }

                        mysqli_stmt_close($stmt);
                    } else {
                        $error = "Error al preparar la consulta: " . mysqli_error($link);
                    }

                    mysqli_close($link);
                }
            } else {
                $error = "Por favor complete todos los campos requeridos.";
            }
        }

        return new ViewModel(array(
            'error' => $error,
            'success' => $success,
            'FechaGeneracion' => $FechaGeneracion,
        ));
    }

    /**
     * Send email asynchronously via API (non-blocking)
     */
    private function sendEmailAsync($apiUrl, $emailData)
    {
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
        
        // Set timeout to 1 second to make it non-blocking
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, 1000);
        curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
        
        // Execute and close immediately (fire and forget)
        curl_exec($ch);
        curl_close($ch);
    }
}
