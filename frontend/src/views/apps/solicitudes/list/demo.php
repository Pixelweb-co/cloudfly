<?php
session_start();
error_reporting(E_ERROR | E_PARSE);
if(!isset($_SESSION["usernamereport"])){
    header("Location: login.php");
    exit(); }
?>

<!DOCTYPE html>
<html lang="en">
<head>

    <?php include ('head.php')?>

</head>

<div>

    <?php include("navbar_new.php");?>

    <div class="p-2" style="margin: auto">

        <?php

        $search = $_GET['item'];

        $query = "SELECT * FROM `products` WHERE id_producto = $search";
        $sql = mysqli_query($coning, $query);
        $item = mysqli_fetch_assoc($sql);

        //id_producto tipo_producto codigo_producto nombre_producto marca_producto modelo_producto placa_producto
        //clase_producto clasificacion_producto cliente_producto status_producto date_added reginv_producto
        //procedencia_producto voltaje_producto potencia_producto frecuencia_producto amperios_producto
        //fecha_compra_producto valor_contable_producto proveedor_producto garantia_producto inicio_garantia_producto
        //fin_garantia_producto manual_producto periocidad sede_producto

        //echo $item['marca_producto'];

        //id equipment name date hour

        $query = "SELECT * FROM `images` WHERE `equipment` = $search";
        $sql = mysqli_query($con, $query);
        $images = mysqli_fetch_assoc($sql);

        //echo $query;
        //echo $images["name"];

        if($images["name"] == ""){$image = "images/default.png";}
        else{$image = "images/uploaded_files/" . $images["name"];}

        //echo $image;
        ?>

        <div class="p-2">

            <div class="row p-2">

                <div class="col-sm-3" style="text-align: center;">

                <img style="height: 300px;" src="<?php echo $image;?>"
                      class="img-thumbnail" onclick="openImage(<?php echo $search;?>)"></div>

                <div class="col-sm-9">

                    <div class="p-2">

                        <div class="card">
                            <div class="card-header">
                                <strong>Dispositivo</strong>
                            </div>
                            <div class="card-body">

                                <div class="row">

                                    <div class="col-sm-3">
                                        <label><strong>Nombre: </strong><?php echo $item['nombre_producto']; ?></label></div>
                                    <div class="col-sm-3"><label><strong>Marca: </strong><?php echo $item['marca_producto']; ?>
                                        </label></div>
                                    <div class="col-sm-3">
                                        <label><strong>Modelo: </strong><?php echo $item['modelo_producto']; ?></label></div>
                                    <div class="col-sm-3"><label><strong>Placa: </strong><?php echo $item['placa_producto']; ?>
                                        </label></div>

                                </div>


                                <div class="row">

                                    <div class="col-sm-3"><label><strong>Serial: </strong><?php echo $item['codigo_producto']; ?>
                                        </label></div>
                                    <!--<div class="col-sm-3"><label><strong>Tipo: </strong><?php

                                    $tipo = $item['tipo_producto'];

                                    $query = "SELECT * FROM `type_device` WHERE `id_type_device` = $tipo";
                                    $sql = mysqli_query($coning, $query);
                                    $tipo = mysqli_fetch_assoc($sql);

                                    echo $tipo['type_device'];

                                    //id_type_device type_device


                                    ?>
                                </label></div>-->
                                    <!--<div class="col-sm-3"><label><strong>Clase: </strong><?php echo $item['clase_producto']; ?>
                                </label></div>-->
                                    <div class="col-sm-3"><label><strong>Registro
                                                Invima: </strong><?php echo $item['reginv_producto']; ?></label></div>
                                    <div class="col-sm-3">
                                        <label><strong>Procedencia: </strong><?php echo $item['procedencia_producto']; ?>
                                        </label></div>

                                    <?php

                                    $query4 = "SELECT * FROM `solicitudes` WHERE id_equipo = $search";
                                    $sql4 = mysqli_query($coning, $query4);
                                    $row4 = mysqli_fetch_assoc($sql4);

                                    $solicitud= $row4['id_solicitud'];

                                    $query3 = "SELECT * FROM `det_solicitud` WHERE id_solicitud = '$solicitud'";

                                    //$query = "SELECT * FROM `equipos_contrato` WHERE id_cliente = $name";

                                    //echo $query;

                                    $sql3 = mysqli_query($coning, $query3);
                                    $sol = mysqli_fetch_assoc($sql3);

                                    ?>

                                    <div class="col-sm-3">
                                        <label><strong>Ubicacion: </strong><?php echo $item['ubicacion_producto']; ?>
                                        </label></div>


                                </div>

                            </div>
                        </div>
                    </div>

                    <div class="p-2">

                        <div class="card">
                            <div class="card-header">
                                <strong>Datos TÃ©cnicos</strong>
                            </div>
                            <div class="card-body">

                                <div class="row">

                                    <div class="col-sm-3">
                                        <label><strong>Voltaje: </strong><?php echo $item['voltaje_producto']; ?></label></div>
                                    <div class="col-sm-3">
                                        <label><strong>Amperios: </strong><?php echo $item['amperios_producto']; ?></label>
                                    </div>
                                    <div class="col-sm-3">
                                        <label><strong>Potencia: </strong><?php echo $item['potencia_producto']; ?></label>
                                    </div>
                                    <div class="col-sm-3">
                                        <label><strong>Frecuencia: </strong><?php echo $item['frecuencia_producto']; ?></label>
                                    </div>

                                </div>


                                <div class="row">

                                    <div class="col-sm-3"><label><strong>Manual de
                                                Usuario: </strong><?php echo $item['manual_producto']; ?></label></div>
                                    <!--<div class="col-sm-3">
                                <label><strong>Estado: </strong><?php echo $item['status_producto']; ?></label></div>-->

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-2">

                <div class="card">
                    <div class="card-header">
                        <strong>InformaciÃ³n Comercial</strong>
                    </div>
                    <div class="card-body">

                        <div class="row">

                            <div class="col-sm-2"><label><strong>Fecha de Compra: </strong><?php echo $item['fecha_compra_producto'];?></label></div>
                            <div class="col-sm-2"><label><strong>Valor Contable: </strong><?php echo $item['valor_contable_producto'];?></label></div>
                            <div class="col-sm-2"><label><strong>Proveedor: </strong><?php echo $item['proveedor_producto'];?></label></div>
                            <div class="col-sm-2"><label><strong>Tiempo de Garantia: </strong><?php echo $item['garantia_producto'];?></label></div>
                            <div class="col-sm-2"><label><strong>Inicio Garantia: </strong><?php echo $item['inicio_garantia_producto'];?></label></div>
                            <div class="col-sm-2"><label><strong>Finaliza Garantia: </strong><?php echo $item['fin_garantia_producto'];?></label></div>

                        </div>


                        <div class="row">

                            <!--<div class="col-sm-3"><label><strong>Tiempo de Garantia: </strong><?php echo $item['garantia_producto'];?></label></div>
                    <div class="col-sm-3"><label><strong>Inicio Garantia: </strong><?php echo $item['inicio_garantia_producto'];?></label></div>
                    <div class="col-sm-3"><label><strong>Finaliza Garantia: </strong><?php echo $item['fin_garantia_producto'];?></label></div>-->

                            <!--<div class="col-sm-3"><label><strong>Fecha del Primer Mantenimiento: </strong><?php echo $item['garantia_producto'];?></label></div>-->
                            <div class="col-sm-6"><label><strong>Periocidad del Mantenimiento: </strong><?php

                                    if(empty($item['periocidad'])){echo "Sin ProgramaciÃ³n";}
                                    else{echo $item['periocidad']." Meses";} ?>

                                </label>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="p-2">
                <div class="card">

                    <div class="card-header">
                        <strong>Protocolo de Mantenimiento</strong>
                    </div>

                    <div class="card-body">

                        <?php

                        //tipo_element, marca, modelo

                        $modelo = $item['modelo_producto'];
                        $marca = $item['marca_producto'];
                        $tipo = $item['tipo_producto'];

                        $query = "SELECT * FROM `plantilla` WHERE `tipo_element` = '$tipo' AND `marca` = '$marca' AND `modelo` = '$modelo' ";
                        $sql = mysqli_query($coning, $query);
                        while($row = mysqli_fetch_assoc($sql)){

                            echo $row['nom'].", ";

                        }

                        //$query = "SELECT * FROM `solicitudes` WHERE id_equipo = $search";
                        //$sql = mysqli_query($coning, $query);
                        //$item = mysqli_fetch_assoc($sql);

                        ?>


                    </div>
                </div>
            </div>

            <div class="p-2">
                 <div class="card">

                    <div class="card-header">
                        <strong>Documentos Anexos</strong>
                    </div>

                    <div class="card-body">

                        <div class="p-1">

                            <?php

                            $docsta = $_GET['docsta'];

                            if (isset($docsta) && $docsta) {

                                if ($docsta == 1) { ?>

                                    <div class="alert alert-success" role="alert">
                                        Proceso Completado.
                                    </div>

                                <?php }

                                if ($docsta == 2) { ?>

                                    <div class="alert alert-danger" role="alert">
                                        Solo se permiten archivos PDF y DOC.
                                    </div>

                                <?php }

                                if ($docsta == 3) { ?>

                                    <div class="alert alert-danger" role="alert">
                                        Introducir una etiqueta valida.
                                    </div>

                                <?php }

                            } ?>

                            <?php

                            $query = "SELECT * FROM `documents` WHERE `equipment` = '$search' AND `enabled` = '1' AND `report` = '0'";
                            $sql = mysqli_query($con, $query);
                            while($row = mysqli_fetch_assoc($sql)){

                                //window.open location.href

                              //  echo $row['name']; ?>

                                <button type="button" class="btn btn-primary" onclick= "window.open('documents/uploaded_files/<?php echo $row['name']; ?>')"><?php echo $row['tag'] ?></button>
                                <?php if ($_SESSION['role'] == "superAdmin" or $_SESSION['role'] == "Admin"){ ?>
                                    <button type="button" class="btn btn-primary" onclick= "updateDocument(<?php echo $row['id']; ?>)"><i class="fas fa-times"></i></button>
                                <?php } ?>

                            <?php }

                            if($_SESSION['name']==276){

                                //$query = "SELECT * FROM `products` WHERE id_producto = $search";
                                //$query = "SELECT * FROM `plantilla` WHERE `tipo_element` = '$tipo' AND `marca` = '$marca' AND `modelo` = '$modelo'";

                                $query = "SELECT * FROM `products` WHERE `id_producto` = '$search'";
                                $sql = mysqli_query($coning, $query);
                                $machine = mysqli_fetch_assoc($sql);

                                $nombre = $machine['nombre_producto'];
                                $marca = $machine['marca_producto'];
                                $modelo = $machine['modelo_producto'];
                                $placa = $machine['placa_producto'];
                                $serial = $machine['codigo_producto'];

                                $query = "SELECT * FROM `qsystemisis` WHERE `Marca` LIKE '$marca' AND `Modelo` LIKE '$modelo' AND `Serie` LIKE '$serial'";

                                //$query = "SELECT * FROM `qsystemisis` WHERE `Serie` LIKE '$serial'";

                                //echo $query;

                                $sql = mysqli_query($con, $query);

                                //Marca Modelo Clase ClasificaciÃ³n Serie Placa

                                while($machine = mysqli_fetch_assoc($sql)){

                                    $idmachine= $machine["id"];

                                    //Qsystem CLINICA ISIS S.A.S

                                    //window.open location.href

                                    //echo $row['name'];

                                    if (file_exists ('documents/Qsystem CLINICA ISIS S.A.S/'.$idmachine.'.pdf')){

                                        ?>

                                        <button type="button" class="btn btn-primary" onclick= "window.open('documents/Qsystem CLINICA ISIS S.A.S/<?php echo $machine["id"].".pdf"; ?>')"> DocumentaciÃ³n</button>

                                    <?php }}} ?>

                        </div>

                        <div class="p-1">
                            <ul class="list-group">
                                <li class="list-group-item list-group-item-dark">Subir Archivo</li>
                                <li class="list-group-item">
                                    <form method="POST" action="documents/upload.php" enctype="multipart/form-data">


                                        <input type="hidden" name="8795" value="<?php echo $search; ?>" />
                                        <!--<span>Upload a File:</span>-->
                                        <input type="file" name="uploadedFile" />
                                        <input name="8456" placeholder="Etiqueta" />
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="customCheck1" name="9635">
                                            <label class="custom-control-label" for="customCheck1">Reporte</label>
                                        </div>

                                        <input type="submit" name="uploadBtn" value="Cargar" />

                                    </form>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>

            </div>


            <div class="p-2">

                <div class="card">

                    <div class="card-header">
                        <strong>Reportes de Mantenimiento</strong>
                    </div>

                    <div class="p-1">

                    <?php

                    $query = "SELECT * FROM `documents` WHERE `equipment` = '$search' AND `enabled` = '1' AND `report` = '1'";
                            $sql = mysqli_query($con, $query);
                            while($row = mysqli_fetch_assoc($sql)){

                                //window.open location.href

                                //echo $row['name']; ?>

                                <button type="button" class="btn btn-primary" onclick= "window.open('documents/uploaded_files/<?php echo $row['name']; ?>')"><i class="fas fa-eye"></i> <?php echo $row['tag'] ?></button>
                                <?php if ($_SESSION['role'] == "superAdmin" or $_SESSION['role'] == "Admin"){ ?>
                                    <button type="button" class="btn btn-primary" onclick= "updateDocument(<?php echo $row['id']; ?>)"><i class="fas fa-times"></i></button>
                                <?php } ?>

                            <?php } ?>

                        <!--
                        <?php

                        $name = $_SESSION['name'];

                        $query = "SELECT * FROM `products` WHERE `id_producto` = '$search'";
                        //$sql = mysqli_query($coning, $query);
                        //$machine = mysqli_fetch_assoc($sql);

                        $nombre = $machine['nombre_producto'];
                        $marca = $machine['marca_producto'];
                        $modelo = $machine['modelo_producto'];
                        $placa = $machine['placa_producto'];
                        $serial = $machine['codigo_producto'];

                        //entidad

                        //echo $machine['codigo_producto'];

                        $query2 = "SELECT * FROM `qsystem2` WHERE `serial` LIKE '$serial' AND `placa` LIKE '$placa' and `modelo` LIKE '$modelo' AND `equipo` LIKE '$nombre'";
                        //$sql2 = mysqli_query($coning, $query2);

                        //while($item = mysqli_fetch_assoc($sql2)){




                        ?>

                        <button type="button" class="btn btn-primary" onclick= "window.open('pdf/index2.php?var2=<?php echo $item['numero'];?>')"><i class="fas fa-eye"></i> <?php echo substr($item['fecha_ini_t'],0,10);?></button>
                        -->
                        <?php

                        //}



                        $query = "SELECT * FROM `solicitudes` WHERE id_equipo = $search  AND `enabled` = '0'";
                        $sql = mysqli_query($coning, $query);

                        while($item = mysqli_fetch_assoc($sql)){

                            if ($item['id_tipo_servicio'] == 1){
                                ?>

                                <button type="button" class="btn btn-primary" onclick= "window.open('pdf/indexPr.php?var2=<?php echo $item['id_solicitud'];?>')"><i class="fas fa-eye"></i> <?php echo $item['fecha'];?></button>

                                <?php if($_SESSION['role'] == "superAdmin" or $_SESSION['role'] == "Admin"){ ?>
                                    <button type="button" class="btn btn-primary" onclick= "updateReport(<?php echo $item['id_solicitud'];?>)"><i class="fas fa-times"></i></button>
                                <?php } ?>

                            <?php }

                            else { ?>

                                <button type="button" class="btn btn-warning" onclick= "window.open('pdf/index.php?var2=<?php echo $item['id_solicitud'];?>')"><i class="fas fa-eye"></i> <?php echo $item['fecha'];?></button>

                                <?php if($_SESSION['role'] == "superAdmin" or $_SESSION['role'] == "Admin"){ ?>
                                    <button type="button" class="btn btn-warning" onclick= "updateReport(<?php echo $item['id_solicitud'];?>)"><i class="fas fa-times"></i></button>
                                <?php } ?>

                            <?php }}?>

                    </div>

                </div>
            </div>

            <?php if($_SESSION['role'] == "superAdmin" or $_SESSION['role'] == "Admin"){ ?>

            <div class="p-2">
                <div class="card">
                    <div class="card-header">
                        <strong>Herramientas</strong>
                    </div>

                    <div class="p-1">

                        <button type="button" class="btn btn-primary" onclick= "workshop('<?php echo $search;?>')"><i class="fas fa-check"></i> Lista de Chequeo</button>
                        <button type="button" class="btn btn-primary" onclick= "signature('<?php echo $search;?>')"><i class="fas fa-signature"></i> Firmas</button>
                        <button type="button" class="btn btn-primary" onclick= "edit('<?php echo $search;?>')"><i class="fas fa-edit"></i> Editar</button>




                    </div>

                    <div id="7895">

                    </div>
                </div>
            </div>

            <?php }?>


            <!--<div class="p-2">
                <div class="card">
                    <div class="card-header">
                        <strong>Reportes de Mantenimiento</strong>
                    </div>

                    <div class="p-1">

                    </div>
                </div>
            </div>-->

        </div>
    </div>
</div>

<script>

    $(document).ready(function () {
        $('#8546').DataTable(
            {
                stateSave: true,

                "language": {
                    "url": "mdbootstrap/Spanish.json"
                }
            }
        );
        $('.dataTables_length').addClass('bs-select');
    });

    function workshop(key){

        $('#7895').load('gadget/checklist.php?item=' + key);

    }

    function signature(key){

        $('#7895').load('gadget/signature.php?item=' + key);

    }

    function edit(key){

        $('#7895').load('gadget/edit.php?item=' + key);

    }

    function gotoProfile(search){

        $.ajax({
            url: "item.php",
            type: "post",
            data: {search},

            success: function (data) {

                //console.log(data);
                //window.locationf="hardware.php";
                $('#4213').html(data);
                $('#5896').val(search);

            }});}

    function openImage(key){

        $('<div/>').dialog({

            modal: true,

            open: function (event, ui)
            {


                if ($(this).is(':empty')) {

                    $(this).load('modal/image.php' + "?search=" + key);
                }
            },

            height: 140,
            width: 500,
            title:"Cambiar Fotografia"});}

    function updateDocument(key){

        alertify.confirm('Eliminar', 'Â¿Desea Continuar?',

            function(){

                $.ajax({
                    url: "crud/updatedocument.php",
                    type: "post",
                    data: {key},

                    success: function (data) {
                        location.reload();
                    }});},

            function(){
                //alertify.error('Cancelado')
                }
            );}

    function updateReport(key){

        alertify.confirm('Eliminar', 'Â¿Desea Continuar?',

            function(){

                $.ajax({
                    url: "crud/update_report.php",
                    type: "post",
                    data: {key},

                    success: function (data) {
                        location.reload();
                    }});},

            function(){
                //alertify.error('Cancelado')
                }
            );}

</script>

</body>
</html>
