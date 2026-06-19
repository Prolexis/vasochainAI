// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DeliveryRegistry
 * @notice Registra de forma inmutable las entregas validadas del Programa
 * Vaso de Leche. Cada entrega queda anclada on-chain con el hash de la
 * evidencia, el resultado de la validación por IA y un timestamp.
 * @dev Pensado para correr sobre un nodo Hardhat local (red de desarrollo),
 * pero la lógica es idéntica a la que correría en una testnet/mainnet real.
 */
contract DeliveryRegistry {
    struct Delivery {
        uint256 id;
        string beneficiarioId;
        string hashEvidencia;
        uint256 timestamp;
        bool resultadoValidacion;
        address registradoPor;
    }

    // Contador autoincremental de entregas registradas.
    uint256 private nextDeliveryId;

    // id de entrega on-chain => datos de la entrega.
    mapping(uint256 => Delivery) private deliveries;

    // beneficiarioId => lista de ids de entregas asociadas.
    mapping(string => uint256[]) private deliveriesByBeneficiario;

    event DeliveryRegistered(
        uint256 indexed id,
        string beneficiarioId,
        string hashEvidencia,
        bool resultadoValidacion,
        uint256 timestamp
    );

    /**
     * @notice Registra una nueva entrega validada.
     * @param beneficiarioId Identificador del beneficiario (UUID o id de DB).
     * @param hashEvidencia Hash (ej. SHA-256) de la evidencia fotográfica.
     * @param resultadoValidacion Resultado booleano de la validación por IA.
     * @return id Identificador autoincremental asignado a la entrega on-chain.
     */
    function registrarEntrega(
        string calldata beneficiarioId,
        string calldata hashEvidencia,
        bool resultadoValidacion
    ) external returns (uint256 id) {
        require(bytes(beneficiarioId).length > 0, "beneficiarioId vacio");
        require(bytes(hashEvidencia).length > 0, "hashEvidencia vacio");

        id = nextDeliveryId;
        nextDeliveryId++;

        deliveries[id] = Delivery({
            id: id,
            beneficiarioId: beneficiarioId,
            hashEvidencia: hashEvidencia,
            timestamp: block.timestamp,
            resultadoValidacion: resultadoValidacion,
            registradoPor: msg.sender
        });

        deliveriesByBeneficiario[beneficiarioId].push(id);

        emit DeliveryRegistered(
            id,
            beneficiarioId,
            hashEvidencia,
            resultadoValidacion,
            block.timestamp
        );

        return id;
    }

    /**
     * @notice Devuelve una entrega por su id on-chain.
     */
    function obtenerEntrega(uint256 id) external view returns (Delivery memory) {
        require(id < nextDeliveryId, "Entrega no existe");
        return deliveries[id];
    }

    /**
     * @notice Devuelve todos los ids on-chain de entregas de un beneficiario.
     */
    function obtenerEntregasPorBeneficiario(
        string calldata beneficiarioId
    ) external view returns (uint256[] memory) {
        return deliveriesByBeneficiario[beneficiarioId];
    }

    /**
     * @notice Devuelve el total de entregas registradas en el contrato.
     */
    function totalEntregas() external view returns (uint256) {
        return nextDeliveryId;
    }
}
