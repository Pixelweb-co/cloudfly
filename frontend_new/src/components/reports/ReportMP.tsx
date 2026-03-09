import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dotenv from "dotenv";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import SignatureDialog from '@components/dialogs/SignatureDialog'
import { Button } from '@mui/material';
import Image from 'next/image';
import { userMethods } from '@/utils/userMethods';



const MaintenanceReport = ({data}:{data:any}) => {

  const [sign,setSign]=useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [firma_solicitud,setFirmaSolicitud]=useState(null)
  const [pdfG,setPdfG]=useState(false)
  const [tcheckeo, setTcheckeo] = useState([])


  const downloadPDF = async (componentId: string, pdfFileName: string = 'MaintenanceReport.pdf') => {
    const input = document.getElementById(componentId);

    setPdfG(true)

    if (!input) {
      console.error(`No se encontró el componente con ID: ${componentId}`);

      return;
    }

    setTimeout(async()=>{
    // Captura el contenido del componente como imagen
    const canvas = await html2canvas(input, {
      scale: 2, // Incrementa la calidad de la imagen
      useCORS: true, // Permite cargar imágenes externas
    });

    const imgData = canvas.toDataURL('image/png');

    // Configurar PDF a tamaño carta
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter', // Tamaño carta: 612 x 792 puntos
    });

    const pageWidth = 612; // Ancho de página carta
    const pageHeight = 792; // Altura de página carta

    // Calcular dimensiones de la imagen dentro del tamaño carta
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // Verificar si la imagen excede la altura de la página y dividirla en varias páginas si es necesario
    let position = 0;

    while (position < imgHeight) {

      pdf.addImage(
        imgData,
        'PNG',
        0,
        position > 0 ? 0 : position, // Agregar imagen desde la parte superior o continuar en la siguiente página
        imgWidth,
        imgHeight > pageHeight ? pageHeight : imgHeight,
      );
      position += pageHeight;

      if (position < imgHeight) {
        pdf.addPage(); // Agregar una nueva página si la imagen excede la altura
      }
    }

    pdf.save(pdfFileName); // Descargar el PDF

    setPdfG(false)
  },1000)
  };


  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleSaveSignature = (file:any) => {
    console.log("Archivo guardado:", file);
    fetchOptions(data)
  };



  const fetchOptions = async (data:any) => {
    console.log('fetchOptions')

    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const [firmaRes] = await Promise.all([

        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/firma-user/sign/${data.asig.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])


      setSign(firmaRes.data.firma)

      const [firmaSolicitudRes] = await Promise.all([


        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/firma-solicitud/sign/${data.idSolicitud}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])


      setFirmaSolicitud(firmaSolicitudRes.data.firma)



      const [CheckeoT] = await Promise.all([


        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/checkeo/${data.idSolicitud}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])

      console.log("tch",CheckeoT.data)
      setTcheckeo(CheckeoT.data)



      return true
    } catch (error) {
      console.error('Error al obtener datos:', error)
    }
  }

  useEffect(() => {


    if(data){

      console.log("report data: ",data)
    fetchOptions(data)
    }

  }, [data])



  return (

        <><div className="text-right p-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => downloadPDF('5674', `MaintenanceReport-${data.idSolicitud}.pdf`)}
        >
          Descargar PDF
        </button>
      </div>

        <div className="container mx-auto text-sm mt-5" id="5674">

            <div className="container w-4/5 p-1 mx-auto">
                <table className="table-auto border text-center w-full">
                    <tbody>
                        <tr>
                            <td rowSpan={3} className="w-1/10">
                                <img src={`${process.env.NEXT_PUBLIC_API_URL}/media/logo.jpg`} alt="Logo" className="w-24 h-24 mt-2" />
                            </td>
                            <td rowSpan={3} className="align-middle">
                                <h5>REPORTE SERVICIO MANTENIMIENTO</h5>
                                <p>Orden No: 100-2019{data.idSolicitud}</p>
                            </td>
                            <th colSpan={2} className="w-1/10">F-MTO-11</th>
                        </tr>
                        <tr>
                            <td>Versión</td>
                            <td>Revisión</td>
                        </tr>
                        <tr>
                            <td colSpan={2}>N° 1</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="container w-4/5 p-1 mx-auto">
                <table className="table-auto border border-collapse w-full">
                    <tbody>
                        <tr>
                            <th className="w-1/6 text-left border pl-1">CUIDAD</th>
                            <td className="w-2/6 text-left border pl-1">{data.reporte.ciudad}</td>
                            <th className="w-1/6 text-left border pl-1">FECHA REPORTE</th>
                            <td className="text-left border pl-1">{data.fecha}</td>
                        </tr>
                        <tr>
                            <th className="w-1/6 text-left border pl-1">INSTITUCION</th>
                            <td className="w-1/6 text-left border pl-1">{data.customer.name}</td>
                            <th className="w-1/6 text-left border pl-1">SEDE</th>
                            <td className="w-1/6 text-left border pl-1">{data.equipo.location}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="container flex w-4/5 p-1 mx-auto">

                <table className="table-auto border border-collapse w-full h-24">
                    <tbody>
                        <tr>
                            <th className=" pl-1 w-1/6 text-left border">EQUIPO</th>
                            <td className=" pl-1 w-2/6 border">{data.equipo.productName}</td>

                        </tr>
                        <tr>
                            <th className=" pl-1 text-left border">MARCA</th>
                            <td className='border  pl-1'>{data.equipo.brand}</td>

                        </tr>
                        <tr>
                            <th className=" pl-1 text-left border">MODELO</th>
                            <td className='border  pl-1'>{data.equipo.model}</td>

                        </tr>
                        <tr>
                            <th className=" pl-1 text-left border">SERIE</th>
                            <td className='border  pl-1'>{data.equipo.licensePlate}</td>

                        </tr>
                        <tr>
                            <th className=" pl-1 text-left border">CODIGO INT</th>
                            <td className='border  pl-1'>{data.equipo.bookValue}</td>

                        </tr>
                        <tr>
                            <th className=" pl-1 text-left border">UBICACION</th>
                            <td className='border  pl-1'>{data.equipo.placement}</td>

                        </tr>
                        <tr>
                            <th className=" pl-1 text-left border">ESTADO DEL EQUIPO</th>
                            <td className='border  pl-1'>{data.reporte?.estadoEquipo &&
                            [
                              {id:1, name: 'FUNCIONAL'},
                              {id:2, name: 'CON FALLAS'},
                              {id:3, name: 'FUERA DE SERVICIO'}
                            ].find((item)=>item.id === data.reporte?.estadoEquipo)?.name}</td>

                        </tr>
                    </tbody>
                </table>

                <table className=" table-auto border border-collapse w-full">
                    <tbody>
                    {data.typeServiceServiceList.map((typeService:any, index:any) => {

                        return(<tr key={index}>
                          <th className="w-5/6 text-left border pl-1">{typeService.descripcion}</th>
                          <td className="w-1/6 border pl-1 text-center">{typeService.id === data.tipoServicio? 'X':''}</td>

                      </tr>)
                    })}
                    </tbody>

                  </table>
            </div>

            <div className="w-4/5 p-1 mx-auto">
                <div className="border rounded shadow-md">
                    <div className="bg-gray-200 font-bold p-2">SOLICITUD Y/O FALLA REPORTADA</div>
                    <div className="p-2">{data.descripcion}</div>
                </div>
            </div>

            <div className="w-4/5 p-1 mx-auto">
                <div className="border rounded shadow-md">
                    <div className="bg-gray-200 font-bold p-2">TRABAJO REALIZADO</div>
                    <div className="p-2"> {data.reporte?.trabajoRealizado}</div>
                </div>
            </div>

            <div className="w-4/5 p-1 mx-auto">
                <div className="border rounded shadow-md">
                    <div className="bg-gray-200 font-bold p-2">OBSERVACIONES</div>
                    <div className="p-2"> {data.reporte?.observaciones}</div>
                </div>
            </div>


            {data.tipoServicio === 1 && <div className="w-4/5 p-2 mx-auto">
                <div className="border rounded shadow-md">

                    <div >

                    <table className="table-auto border w-full h-24">
                    <thead className="bg-gray-200 font-bold p-2">
                    <th className="w-1/6 text-left p-2">ACTIVIDAD</th>
                    <th className="w-1/6 text-left p-2">APROBADO</th>
                    </thead>

                    <tbody>
                    {tcheckeo && tcheckeo.map((item:any,index)=>{

                        return (<tr key={index}>

                            <td className="w-2/6 p-2">{item.nombre}</td>
                            <td className="w-2/6 p-2">{item.valor}</td>

                        </tr>)

                      })}
                    </tbody>
                </table>

                    </div>
                </div>
            </div>}




            <div className="container w-4/5 p-1 mx-auto">
                <table className="table-auto border w-full">
                    <tbody>
                        <tr>
                            <th className="w-1/6">Firma</th>
                            <td className="w-2/6">
                               {sign && <Image src={`${process.env.NEXT_PUBLIC_API_URL}/firma-user/${sign}`} alt="Firma 1" width={180} height={64} />}
                            </td>
                            <th className="w-1/6">Firma</th>
                            <td>

                                {firma_solicitud &&

                                <Image src={`${process.env.NEXT_PUBLIC_API_URL}/firma-solicitud/${firma_solicitud}`} alt="Firma 2" width={180} height={64} />


                                }


{!pdfG && (userMethods.isRole('SUPERADMIN') || userMethods.isRole('BIOMEDICAL')) && <Button variant="contained" onClick={handleOpenDialog}>
        Abrir Dialogo de Firma
      </Button>}
                            </td>
                        </tr>
                        <tr>
                            <th>Ingeniero</th>
                            <td>{data.asig.nombres} {data.asig.apellidos}</td>
                            <th>Recibe</th>
                            <td>&nbsp;</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <SignatureDialog
        open={dialogOpen}
        solicitud_id={data.idSolicitud}
        onClose={handleCloseDialog}
        onSave={handleSaveSignature}
      />




        </>
    );
};

export default MaintenanceReport;
