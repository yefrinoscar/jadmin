import * as React from 'react';

interface UserAccessEmailProps {
  email: string;
  password: string;
  loginUrl: string;
  companyName?: string;
}

export const UserAccessEmail: React.FC<UserAccessEmailProps> = ({
  email,
  password,
  loginUrl,
  companyName = 'JAdmin',
}) => {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Tu Acceso a JAdmin</title>
        <style>
          {`
            /* Base */
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              -webkit-font-smoothing: antialiased;
              font-size: 16px;
              line-height: 1.5;
              margin: 0;
              padding: 0;
              -ms-text-size-adjust: 100%;
              -webkit-text-size-adjust: 100%;
              background-color: #f6f9fc;
              color: #333;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            
            .header {
              text-align: center;
              padding: 20px 0;
            }
            
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #4f46e5;
            }
            
            .content {
              padding: 20px 0;
            }
            
            .credentials-box {
              background-color: #f9fafb;
              border-radius: 6px;
              padding: 16px;
              margin: 20px 0;
              border-left: 4px solid #4f46e5;
            }
            
            .credential-item {
              margin-bottom: 12px;
            }
            
            .label {
              font-weight: 600;
              color: #6b7280;
              display: block;
              margin-bottom: 4px;
            }
            
            .value {
              font-family: monospace;
              background-color: #ffffff;
              padding: 8px 12px;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
              font-size: 14px;
            }
            
            .button {
              display: inline-block;
              background-color: #ffffff;
              color: #4f46e5;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 600;
              margin-top: 20px;
              text-align: center;
              border: 1px solid #4f46e5;
            }
            
            .button:hover {
              background-color: #f8f8ff;
            }
            
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              padding: 20px 0;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">{companyName}</div>
          </div>
          <div className="content">
            <h1>¡Bienvenido a {companyName}!</h1>
            <p>Tu cuenta ha sido creada. A continuación están tus credenciales de acceso:</p>
            
            <div className="credentials-box">
              <div className="credential-item">
                <span className="label">Correo electrónico:</span>
                <div className="value">{email}</div>
              </div>
              
              <div className="credential-item">
                <span className="label">Contraseña:</span>
                <div className="value">{password}</div>
              </div>
            </div>
            
            <p>Por favor utiliza estas credenciales para iniciar sesión en tu cuenta. Por razones de seguridad, te recomendamos cambiar tu contraseña después de tu primer inicio de sesión.</p>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <a href={loginUrl} className="button">
                Iniciar Sesión Ahora
              </a>
            </div>
          </div>
          
          <div className="footer">
            <p>Si tienes alguna pregunta, por favor contacta a tu administrador.</p>
            <p>&copy; {new Date().getFullYear()} {companyName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default UserAccessEmail;
