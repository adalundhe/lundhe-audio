import { GearTable } from './GearTable'
import { api } from '~/utils/api';


export const GearDisplay = () => {


    const [data, _]= api.equipment.getAllEquipment.useSuspenseQuery({})

    return (
        <GearTable data={data} />
    )
}