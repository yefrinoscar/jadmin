<?php
namespace JEvans\Controller;

use Zend\Mvc\Controller\AbstractActionController;
use Zend\View\Model\ViewModel;
use Zend\Mail\Message;
use Zend\Mime;
use Zend\Mail\Transport\Sendmail as MailTransport;
use AppOrm\Mapper\ItemMapper;

class BuzonController extends AbstractActionController
{
    protected $mailTo = 'jcordova@jevansa.com.pe';

    public function indexAction()
    {
        $InsertId = "";
        $FechaGeneracion = date("d/m/Y H:i:s");
        $error = "";

        if (
            isset($_POST["solicitud"]) && !empty($_POST["solicitud"]) &&
            isset($_POST["nombre"]) && !empty($_POST["nombre"]) &&
            isset($_POST["email"]) && !empty($_POST["email"]) &&
            isset($_POST["telefono"]) && !empty($_POST["telefono"]) &&
            isset($_POST["direccion"]) && !empty($_POST["direccion"]) &&
            isset($_POST["servicio"])
        ) {
            // Sanitize and prepare values
            $solicitud = trim($_POST["solicitud"]);
            $servicio = $_POST["servicio"];
            if (is_array($servicio)) {
                $servicio = implode(",", $servicio);
            }

            $nombre = trim($_POST["nombre"]);
            $email = trim($_POST["email"]);
            $telefono = trim($_POST["telefono"]);
            $direccion = trim($_POST["direccion"]);

            // --- Handle file uploads ---
            $attachments = []; // Array to store base64 attachments
            if (isset($_FILES["evidencias"]) && !empty($_FILES["evidencias"]["name"][0])) {
                foreach ($_FILES["evidencias"]["tmp_name"] as $key => $tmpName) {
                    if (is_uploaded_file($tmpName)) {
                        // Read file directly from temp location and convert to base64
                        $fileContent = file_get_contents($tmpName);
                        $base64Content = base64_encode($fileContent);
                        
                        // Get MIME type
                        $finfo = finfo_open(FILEINFO_MIME_TYPE);
                        $mimeType = finfo_file($finfo, $tmpName);
                        finfo_close($finfo);
                        
                        // Add to attachments array
                        $attachments[] = [
                            'filename' => $_FILES["evidencias"]["name"][$key],
                            'content' => $base64Content,
                            'contentType' => $mimeType
                        ];
                    }
                }
            }
            $filesString = "";

            // --- Database connection ---
            $link = mysqli_connect('localhost', 'jevansa_jevans', 'RpMN6@we2', 'jevansa_jevans');
            if (!$link) {
                $error = "Error de conexión a la base de datos";
            } else {
                // Insert query
                $sql = "INSERT INTO buzon (tipo_solicitud, tipo_servicio, nombre, email, telefono, direccion, evidencias)
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = mysqli_prepare($link, $sql);
                mysqli_stmt_bind_param($stmt, "sssssss", $solicitud, $servicio, $nombre, $email, $telefono, $direccion, $filesString);
                $result = mysqli_stmt_execute($stmt);

                if ($result) {
                    $InsertId = mysqli_insert_id($link);

                    $subject = "[Formulario de Quejas, Sugerencias y Reclamos] Nuevo Registro #" . str_pad($insertId, 6, "0", STR_PAD_LEFT);

                    // --- Email body ---
                    $html = '
					<table width="600" cellpadding="5" style="margin: 0 auto; font-family: Arial;">
						<tr>
							<td colspan="2" style="font-size: 18pt; color: #666;">Buzón</td>
						</tr>
						<tr><td><strong>Tipo de Solicitud:</strong></td><td>' . htmlspecialchars($solicitud) . '</td></tr>
						<tr><td><strong>Tipo de Servicio:</strong></td><td>' . htmlspecialchars($servicio) . '</td></tr>
						<tr><td><strong>Nombre Completo:</strong></td><td>' . htmlspecialchars($nombre) . '</td></tr>
						<tr><td><strong>Correo Electrónico:</strong></td><td>' . htmlspecialchars($email) . '</td></tr>
						<tr><td><strong>Teléfono:</strong></td><td>' . htmlspecialchars($telefono) . '</td></tr>
						<tr><td><strong>Dirección:</strong></td><td>' . htmlspecialchars($direccion) . '</td></tr>
						<tr><td><strong>Número de Registro:</strong></td><td>#' . str_pad($InsertId, 6, "0", STR_PAD_LEFT) . '</td></tr>
						<tr><td><strong>Fecha:</strong></td><td>' . $FechaGeneracion . '</td></tr>
						<tr><td colspan="2" style="font-size: 10pt; background:#f0f0f0; text-align:center;">&copy; J Evans. Todos los derechos reservados.</td></tr>
					</table>
					';

                    // --- Send emails via API (asynchronously) ---
                    $apiUrl = 'https://jadmin-nu.vercel.app/api/email-smtp';
                    
                    // Email 1: Send to admin
                    $emailDataAdmin = [
                        'to' => $this->mailTo,
                        'subject' => $subject,
                        'html' => $html,
                        'from' => 'soporteit@jevansa.com.pe'
                    ];
                    
                    // Add attachments if any
                    if (!empty($attachments)) {
                        $emailDataAdmin['attachments'] = $attachments;
                    }
                    
                    // Email 2: Send to user
                    $emailDataUser = [
                        'to' => $email,
                        'subject' => $subject,
                        'html' => $html,
                        'from' => 'soporteit@jevansa.com.pe'
                    ];
                    
                    // Add attachments if any
                    if (!empty($attachments)) {
                        $emailDataUser['attachments'] = $attachments;
                    }
                    
                    // Send both emails asynchronously (non-blocking)
                    $this->sendEmailAsync($apiUrl, $emailDataAdmin);
                    $this->sendEmailAsync($apiUrl, $emailDataUser);

					return new ViewModel(array(
						'success' => true,
						'error' => false
					));

                } else {
                    $error = mysqli_error($link);
                }

                mysqli_close($link);
            }
        }

        $mapper = new ItemMapper();
        return new ViewModel(array(
			'success'=> false,
            'error' => $error,
            'InsertId' => $InsertId,
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