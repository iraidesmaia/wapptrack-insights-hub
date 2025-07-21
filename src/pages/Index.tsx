import { UTMCaptureIntegration } from "@/components/ui/utm-capture-integration";

const Index = () => {
  return (
    <>
      {/* UTM Capture Integration */}
      <UTMCaptureIntegration 
        debug={true}
        formSelector="form"
        phoneFieldSelector="input[type='tel'], input[name*='phone'], input[id*='phone'], input[placeholder*='telefone'], input[placeholder*='WhatsApp']"
        whatsappButtonSelector=".whatsapp-btn, [href*='wa.me'], [href*='whatsapp.com']"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Landing Page com UTM Tracking</h1>
          <p className="text-xl text-gray-600 mb-8">Sistema de unificação de dados de leads implementado!</p>
          
          {/* Exemplo de formulário com campo de telefone */}
          <form className="max-w-sm mx-auto space-y-4">
            <input 
              type="tel" 
              placeholder="Digite seu WhatsApp" 
              className="w-full px-4 py-2 border rounded-lg"
            />
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Enviar
            </button>
          </form>
          
          {/* Exemplo de botão WhatsApp */}
          <a 
            href="https://wa.me/5585999999999" 
            className="whatsapp-btn inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </>
  );
};

export default Index;
